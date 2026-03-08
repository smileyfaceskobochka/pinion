use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum PinionError {
  #[error("server not found: {0}")]
  ServerNotFound(Uuid),
  #[error("node not found: {0}")]
  NodeNotFound(Uuid),
  #[error("user not found: {0}")]
  UserNotFound(Uuid),
  #[error("egg not found: {0}")]
  EggNotFound(Uuid),
  #[error("allocation not found: {0}")]
  AllocationNotFound(Uuid),

  #[error("invalid credentials")]
  InvalidCredentials,
  #[error("forbidden")]
  Forbidden,
  #[error("invalid token")]
  InvalidToken,

  #[error("allocation already taken: {0}")]
  AllocationTaken(Uuid),
  #[error("no allocations available for node: {0}")]
  NoAllocationsAvailable(Uuid),
  #[error("insufficient memory on node: {0}")]
  InsufficientMemory(Uuid),
  #[error("insufficient disk on node: {0}")]
  InsufficientDisk(Uuid),

  #[error("wings error: {0}")]
  WingsError(String),
  #[error("wings unreachable on node: {0}")]
  WingsUnreachable(Uuid),

  #[error("validation error: {0}")]
  Validation(String),
  #[error("database error: {0}")]
  Database(String),
  #[error("internal error: {0}")]
  Internal(String),
}

pub type PinionResult<T> = Result<T, PinionError>;
