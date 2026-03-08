use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{
  extract::{Path, State},
  Json,
};
use pinion_core::models::Allocation;
use pinion_db::repos::AllocationRepo;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateAllocationRequest {
  pub node_id: Uuid,
  pub ip: String,
  pub port: u16,
}

pub async fn list_node_allocations(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(node_id): Path<Uuid>,
) -> ApiResult<Json<Vec<Allocation>>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let allocations = AllocationRepo::list_by_node(&state.pool, node_id).await?;
  Ok(Json(allocations))
}

pub async fn create_allocation(
  State(state): State<AppState>,
  auth: AuthUser,
  Json(payload): Json<CreateAllocationRequest>,
) -> ApiResult<Json<Allocation>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let allocation =
    AllocationRepo::create(&state.pool, payload.node_id, &payload.ip, payload.port).await?;
  Ok(Json(allocation))
}
