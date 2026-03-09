use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{
  Json,
  extract::{Path, Query, State},
};
use pinion_db::repos::{NodeRepo, ServerRepo};
use pinion_wings::WingsClient;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct FileQuery {
  pub path: String,
}

pub async fn list_files(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(server_id): Path<Uuid>,
  Query(query): Query<FileQuery>,
) -> ApiResult<Json<serde_json::Value>> {
  let server = ServerRepo::find_by_id(&state.pool, server_id).await?;
  if !auth.is_root && server.owner_id != auth.id {
    return Err(ApiError::Forbidden);
  }

  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;
  let wings = WingsClient::from_node(&node);
  let files = wings.list_files(server.id, &query.path).await?;
  Ok(Json(files))
}

pub async fn read_file(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(server_id): Path<Uuid>,
  Query(query): Query<FileQuery>,
) -> ApiResult<String> {
  let server = ServerRepo::find_by_id(&state.pool, server_id).await?;
  if !auth.is_root && server.owner_id != auth.id {
    return Err(ApiError::Forbidden);
  }

  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;
  let wings = WingsClient::from_node(&node);
  let content = wings.get_file_contents(server.id, &query.path).await?;
  Ok(content)
}

pub async fn write_file(
  State(state): State<AppState>,
  auth: AuthUser,
  Path(server_id): Path<Uuid>,
  Query(query): Query<FileQuery>,
  body: String,
) -> ApiResult<()> {
  let server = ServerRepo::find_by_id(&state.pool, server_id).await?;
  if !auth.is_root && server.owner_id != auth.id {
    return Err(ApiError::Forbidden);
  }

  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;
  let wings = WingsClient::from_node(&node);
  wings.write_file(server.id, &query.path, &body).await?;
  Ok(())
}
