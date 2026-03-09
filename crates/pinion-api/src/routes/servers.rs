use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{
  Json,
  extract::{Path, State},
};
use pinion_core::models::{Server, ServerLimits};
use pinion_db::repos::{AllocationRepo, EggRepo, NodeRepo, ServerRepo};
// use pinion_wings::types::WingsServerConfig;
use pinion_wings::WingsClient;
use serde::Deserialize;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateServerRequest {
  pub name: String,
  pub description: Option<String>,
  pub owner_id: Uuid,
  pub node_id: Uuid,
  pub egg_id: Uuid,
  pub limits: ServerLimits,
  pub environment: HashMap<String, String>,
}

pub async fn list_servers(
  State(state): State<AppState>,
  auth: AuthUser,
) -> ApiResult<Json<Vec<Server>>> {
  let servers = if auth.is_root {
    ServerRepo::list(&state.pool, 100, 0).await?
  } else {
    ServerRepo::find_by_owner(&state.pool, auth.id).await?
  };
  Ok(Json(servers))
}

pub async fn create_server(
  State(state): State<AppState>,
  auth: AuthUser,
  Json(payload): Json<CreateServerRequest>,
) -> ApiResult<Json<Server>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }

  // Start transaction
  let mut tx = state
    .pool
    .begin()
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to start transaction: {}", e)))?;

  // Find available allocation (uses FOR UPDATE within transaction)
  let allocation = AllocationRepo::find_available(&mut *tx, payload.node_id).await?;

  // Load node and egg for Wings config
  let node = NodeRepo::find_by_id(&mut *tx, payload.node_id).await?;
  let _egg = EggRepo::find_by_id(&mut *tx, payload.egg_id).await?;

  // Create server record
  let server = ServerRepo::create(
    &mut *tx,
    &payload.name,
    payload.description.as_deref(),
    payload.owner_id,
    payload.node_id,
    allocation.id,
    payload.egg_id,
    &payload.limits,
    &payload.environment,
  )
  .await?;

  // Assign allocation
  AllocationRepo::assign(&mut *tx, allocation.id, server.id).await?;

  // Commit transaction BEFORE Wings call so Wings can see the server
  tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

  // Wings API call
  let wings = WingsClient::from_node(&node);

  match wings.create_server(server.id, true).await {
    Ok(_) => Ok(Json(server)),
    Err(e) => {
      tracing::error!("Wings failed to create server: {:?}", e);
      // Update status to InstallFailed
      let _ = ServerRepo::update_status(
        &state.pool,
        server.id,
        pinion_core::models::ServerState::InstallFailed,
      )
      .await;
      Err(e.into())
    }
  }
}

pub async fn set_power(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(id): Path<Uuid>,
  Json(payload): Json<HashMap<String, String>>,
) -> ApiResult<()> {
  // Load server and verify permissions
  let server = ServerRepo::find_by_id(&state.pool, id).await?;

  // Authorization check
  if !auth.is_root && server.owner_id != auth.id {
    return Err(ApiError::Forbidden);
  }

  let action_str =
    payload.get("action").ok_or(ApiError::BadRequest("Missing action".to_string()))?;
  let action = match action_str.as_str() {
    "start" => pinion_wings::types::PowerAction::Start,
    "stop" => pinion_wings::types::PowerAction::Stop,
    "restart" => pinion_wings::types::PowerAction::Restart,
    "kill" => pinion_wings::types::PowerAction::Kill,
    _ => return Err(ApiError::BadRequest("Invalid power action".to_string())),
  };

  // Load node
  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;

  // Call Wings
  let wings = WingsClient::from_node(&node);
  wings.set_power(server.id, action).await.map_err(ApiError::from)?;

  Ok(())
}
