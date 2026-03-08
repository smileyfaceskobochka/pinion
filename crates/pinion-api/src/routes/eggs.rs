use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{extract::State, Json};
use pinion_core::models::Egg;
use pinion_db::repos::EggRepo;

pub async fn list_eggs(State(state): State<AppState>, auth: AuthUser) -> ApiResult<Json<Vec<Egg>>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let eggs = EggRepo::list(&state.pool).await?;
  Ok(Json(eggs))
}

pub async fn upsert_egg(
  State(state): State<AppState>,
  auth: AuthUser,
  Json(payload): Json<Egg>,
) -> ApiResult<Json<Egg>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let egg = EggRepo::upsert(&state.pool, &payload).await?;
  Ok(Json(egg))
}
