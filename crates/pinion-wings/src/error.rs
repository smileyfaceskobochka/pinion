use thiserror::Error;

#[derive(Debug, Error)]
pub enum WingsError {
  #[error("wings HTTP error {status}: {body}")]
  Http { status: u16, body: String },
  #[error("wings unreachable: {0}")]
  Unreachable(String),
  #[error("wings response error: {0}")]
  Parse(String),
  #[error("JWT error: {0}")]
  Jwt(String),
}

pub type WingsResult<T> = Result<T, WingsError>;
