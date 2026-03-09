use crate::error::ApiError;
use crate::state::AppState;
use axum::{
  RequestPartsExt,
  extract::{FromRef, FromRequestParts},
  http::request::Parts,
};
use axum_extra::{
  TypedHeader,
  headers::{Authorization, authorization::Bearer},
};
use jsonwebtoken::{DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
  pub sub: Uuid,
  pub email: String,
  pub is_root: bool,
  pub exp: usize,
}

pub struct AuthUser {
  pub id: Uuid,
  #[allow(dead_code)]
  pub email: String,
  pub is_root: bool,
}

impl<S> FromRequestParts<S> for AuthUser
where
  AppState: FromRef<S>,
  S: Send + Sync,
{
  type Rejection = ApiError;

  async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
    // Extract AppState to get the secret
    let app_state = AppState::from_ref(state);

    // Extract the token
    let bearer = parts
      .extract::<TypedHeader<Authorization<Bearer>>>()
      .await
      .map_err(|_| ApiError::Unauthorized)?;

    let token_data = decode::<Claims>(
      bearer.0.token(),
      &DecodingKey::from_secret(app_state.config.jwt_secret.as_bytes()),
      &Validation::default(),
    )
    .map_err(|_| ApiError::Unauthorized)?;

    Ok(AuthUser {
      id: token_data.claims.sub,
      email: token_data.claims.email,
      is_root: token_data.claims.is_root,
    })
  }
}
