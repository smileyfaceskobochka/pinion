use axum::{
  http::StatusCode,
  response::{IntoResponse, Response},
  Json,
};
use pinion_core::error::PinionError;
use pinion_wings::error::WingsError;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
  #[error("not found: {0}")]
  NotFound(String),
  #[error("forbidden")]
  Forbidden,
  #[error("unauthorized")]
  Unauthorized,
  #[error("bad request: {0}")]
  BadRequest(String),
  #[error("conflict: {0}")]
  Conflict(String),
  #[error("internal server error: {0}")]
  Internal(String),
  #[error("service unavailable: {0}")]
  ServiceUnavailable(String),
}

impl IntoResponse for ApiError {
  fn into_response(self) -> Response {
    let (status, message) = match self {
      Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
      Self::Forbidden => (StatusCode::FORBIDDEN, "Forbidden".to_string()),
      Self::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized".to_string()),
      Self::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
      Self::Conflict(msg) => (StatusCode::CONFLICT, msg),
      Self::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
      Self::ServiceUnavailable(msg) => (StatusCode::SERVICE_UNAVAILABLE, msg),
    };

    let body = Json(json!({
        "error": message,
    }));

    (status, body).into_response()
  }
}

impl From<PinionError> for ApiError {
  fn from(err: PinionError) -> Self {
    match err {
      PinionError::ServerNotFound(_)
      | PinionError::NodeNotFound(_)
      | PinionError::UserNotFound(_)
      | PinionError::EggNotFound(_)
      | PinionError::AllocationNotFound(_) => Self::NotFound(err.to_string()),
      PinionError::InvalidCredentials | PinionError::InvalidToken => Self::Unauthorized,
      PinionError::Forbidden => Self::Forbidden,
      PinionError::AllocationTaken(_) => Self::Conflict(err.to_string()),
      PinionError::NoAllocationsAvailable(_)
      | PinionError::InsufficientMemory(_)
      | PinionError::InsufficientDisk(_) => Self::BadRequest(err.to_string()),
      PinionError::WingsUnreachable(_) => Self::ServiceUnavailable(err.to_string()),
      PinionError::Database(e) | PinionError::Internal(e) | PinionError::WingsError(e) => {
        Self::Internal(e)
      }
      PinionError::Validation(e) => Self::BadRequest(e),
    }
  }
}

impl From<WingsError> for ApiError {
  fn from(err: WingsError) -> Self {
    match err {
      WingsError::Http { status, body } => {
        if status == 404 {
          Self::NotFound("Resource not found on Wings".to_string())
        } else if status == 403 {
          Self::Forbidden
        } else {
          Self::Internal(format!("Wings HTTP {}: {}", status, body))
        }
      }
      WingsError::Unreachable(e) => Self::ServiceUnavailable(e),
      WingsError::Parse(e) | WingsError::Jwt(e) => Self::Internal(e),
    }
  }
}

pub type ApiResult<T> = Result<T, ApiError>;
