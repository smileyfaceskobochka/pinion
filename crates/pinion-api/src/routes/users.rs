use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::AuthUser;
use crate::state::AppState;
use axum::{Json, extract::State};
use pinion_core::models::User;
use pinion_db::repos::UserRepo;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateUserRequest {
  pub email: String,
  pub username: String,
  pub password: String,
}

pub async fn list_users(
  State(state): State<AppState>,
  auth: AuthUser,
) -> ApiResult<Json<Vec<User>>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }
  let users = UserRepo::list(&state.pool, 100, 0).await?;
  Ok(Json(users))
}

pub async fn create_user(
  State(state): State<AppState>,
  auth: AuthUser,
  Json(payload): Json<CreateUserRequest>,
) -> ApiResult<Json<User>> {
  if !auth.is_root {
    return Err(ApiError::Forbidden);
  }

  let argon2 = argon2::Argon2::default();
  let salt = argon2::password_hash::SaltString::generate(&mut rand::thread_rng());
  let password_hash = argon2::password_hash::PasswordHasher::hash_password(
    &argon2,
    payload.password.as_bytes(),
    &salt,
  )
  .map_err(|e| ApiError::Internal(e.to_string()))?
  .to_string();

  let user =
    UserRepo::create(&state.pool, &payload.email, &payload.username, &password_hash, false).await?;

  Ok(Json(user))
}
