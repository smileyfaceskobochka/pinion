use crate::error::{ApiError, ApiResult};
use crate::middleware::auth::Claims;
use crate::state::AppState;
use argon2::{
  Argon2,
  password_hash::{PasswordHash, PasswordVerifier},
};
use axum::{Json, extract::State};
use jsonwebtoken::{EncodingKey, Header, encode};
use pinion_db::repos::UserRepo;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct LoginRequest {
  pub email: String,
  pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
  pub token: String,
}

pub async fn login(
  State(state): State<AppState>,
  Json(payload): Json<LoginRequest>,
) -> ApiResult<Json<LoginResponse>> {
  let user = UserRepo::find_by_email(&state.pool, &payload.email).await?;

  let argon2 = Argon2::default();
  let parsed_hash = PasswordHash::new(&user.password_hash)
    .map_err(|_| ApiError::Internal("Invalid password hash in database".to_string()))?;

  argon2
    .verify_password(payload.password.as_bytes(), &parsed_hash)
    .map_err(|_| ApiError::Unauthorized)?;

  let now = time::OffsetDateTime::now_utc().unix_timestamp();
  let claims = Claims {
    sub: user.id,
    email: user.email,
    is_root: user.root_admin,
    exp: (now + 86400) as usize, // 24 hours
  };

  let token = encode(
    &Header::default(),
    &claims,
    &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
  )
  .map_err(|e| ApiError::Internal(e.to_string()))?;

  Ok(Json(LoginResponse { token }))
}

#[derive(Deserialize)]
pub struct RegisterRequest {
  pub email: String,
  pub username: String,
  pub password: String,
}

pub async fn register(
  State(state): State<AppState>,
  Json(payload): Json<RegisterRequest>,
) -> ApiResult<Json<LoginResponse>> {
  let argon2 = Argon2::default();
  let salt = argon2::password_hash::SaltString::generate(&mut rand::thread_rng());
  let password_hash = argon2::password_hash::PasswordHasher::hash_password(
    &argon2,
    payload.password.as_bytes(),
    &salt,
  )
  .map_err(|e| ApiError::Internal(e.to_string()))?
  .to_string();

  // Auto-promote first user to root admin (bootstrap)
  let user_count = UserRepo::count(&state.pool).await?;
  let is_first_user = user_count == 0;

  let user =
    UserRepo::create(&state.pool, &payload.email, &payload.username, &password_hash, is_first_user)
      .await?;

  // Log them in immediately
  let now = time::OffsetDateTime::now_utc().unix_timestamp();
  let claims = Claims {
    sub: user.id,
    email: user.email,
    is_root: user.root_admin,
    exp: (now + 86400) as usize,
  };

  let token = encode(
    &Header::default(),
    &claims,
    &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
  )
  .map_err(|e| ApiError::Internal(e.to_string()))?;

  Ok(Json(LoginResponse { token }))
}
