use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::Claims;
use crate::state::AppState;
use axum::{
  extract::{ws::WebSocketUpgrade, Path, Query, State},
  response::IntoResponse,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use pinion_db::repos::{NodeRepo, ServerRepo};
use pinion_wings::WingsWsProxy;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct WsQuery {
  pub token: String,
}

pub async fn console_ws(
  State(state): State<AppState>,
  Path(server_id): Path<Uuid>,
  Query(query): Query<WsQuery>,
  ws: WebSocketUpgrade,
) -> ApiResult<impl IntoResponse> {
  // 1. Validate session JWT from query param
  let token_data = decode::<Claims>(
    &query.token,
    &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    &Validation::default(),
  )
  .map_err(|_| ApiError::Unauthorized)?;

  let user_id = token_data.claims.sub;
  let is_root = token_data.claims.is_root;

  // 2. Load server and verify console permission
  let server = ServerRepo::find_by_id(&state.pool, server_id).await?;

  if !is_root && server.owner_id != user_id {
    return Err(ApiError::Forbidden);
  }

  // 3. Load node for Wings connectivity
  let node = NodeRepo::find_by_id(&state.pool, server.node_id).await?;

  // 4. Connect to Wings WebSocket BEFORE accepting the Axum upgrade
  let wings_proxy = WingsWsProxy::new(node, server.id);
  let wings_handle = wings_proxy.connect().await.map_err(ApiError::from)?;

  // 5. Accept the upgrade and start proxying
  Ok(ws.on_upgrade(move |socket| async move {
    if let Err(e) = wings_handle.proxy(socket).await {
      tracing::error!("WebSocket proxy error for server {}: {:?}", server_id, e);
    }
  }))
}
