use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{
  extract::{Path, State},
  Json,
};
use pinion_core::models::{Server, ServerLimits};
use pinion_db::repos::{AllocationRepo, EggRepo, NodeRepo, ServerRepo};
use pinion_wings::types::WingsServerConfig;
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

  // 1. Start transaction
  let mut tx = state
    .pool
    .begin()
    .await
    .map_err(|e| ApiError::Internal(format!("Failed to start transaction: {}", e)))?;

  // 2. Find available allocation (uses FOR UPDATE within transaction)
  let allocation = AllocationRepo::find_available(&mut *tx, payload.node_id).await?;

  // 3. Load node and egg for Wings config
  let node = NodeRepo::find_by_id(&mut *tx, payload.node_id).await?;
  let egg = EggRepo::find_by_id(&mut *tx, payload.egg_id).await?;

  // 4. Create server record (within transaction)
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

  // 5. Assign allocation
  AllocationRepo::assign(&mut *tx, allocation.id, server.id).await?;

  // 6. Wings API call
  let wings = WingsClient::from_node(&node);
  let wings_config = WingsServerConfig {
    uuid: server.id,
    start_on_completion: true,
    skip_scripts: false,
    environment: payload.environment.clone(),
    invocation: egg.startup.clone(),
    build: pinion_wings::types::WingsBuildConfig {
      memory: payload.limits.memory,
      swap: payload.limits.swap,
      disk: payload.limits.disk,
      io: payload.limits.io,
      cpu: payload.limits.cpu,
      threads: payload.limits.threads,
      oom_disabled: true,
    },
    container: pinion_wings::types::WingsContainerConfig { image: egg.docker_image.clone() },
    allocations: pinion_wings::types::WingsAllocationConfig {
      default: pinion_wings::types::WingsAllocation {
        ip: allocation.ip.clone(),
        port: allocation.port,
      },
      additional: vec![],
    },
  };

  match wings.create_server(&wings_config).await {
    Ok(_) => {
      // 7. Success - Commit transaction
      tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
      Ok(Json(server))
    }
    Err(e) => {
      // 8. Rollback - transaction automatically drops and rolls back
      tracing::error!("Wings failed to create server: {:?}", e);
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
  // 1. Load server and verify permissions
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

  // 2. Load node
  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;

  // 3. Call Wings
  let wings = WingsClient::from_node(&node);
  wings.set_power(server.id, action).await.map_err(ApiError::from)?;

  Ok(())
}
