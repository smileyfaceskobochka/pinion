use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{
  extract::{Path, State},
  Json,
};
use pinion_core::models::{Node, NodeScheme};
use pinion_db::repos::NodeRepo;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateNodeRequest {
  pub name: String,
  pub fqdn: String,
  pub scheme: NodeScheme,
  pub port: u16,
  pub daemon_token: String,
  pub memory: u64,
  pub disk: u64,
}

pub async fn list_nodes(
  State(state): State<AppState>,
  auth: AuthUser,
) -> ApiResult<Json<Vec<Node>>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let nodes = NodeRepo::list(&state.pool).await?;
  Ok(Json(nodes))
}

pub async fn create_node(
  State(state): State<AppState>,
  auth: AuthUser,
  Json(payload): Json<CreateNodeRequest>,
) -> ApiResult<Json<Node>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let node = NodeRepo::create(
    &state.pool,
    &payload.name,
    &payload.fqdn,
    payload.scheme,
    payload.port,
    &payload.daemon_token,
    payload.memory,
    payload.disk,
  )
  .await?;
  Ok(Json(node))
}

pub async fn delete_node(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(id): Path<Uuid>,
) -> ApiResult<()> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  NodeRepo::delete(&state.pool, id).await?;
  Ok(())
}
