use crate::permissions::Permissions;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
  pub id: Uuid,
  pub email: String,
  #[serde(skip_serializing)]
  pub password_hash: String,
  pub username: String,
  pub root_admin: bool,
  pub permissions: Permissions,
  pub created_at: OffsetDateTime,
  pub updated_at: OffsetDateTime,
}
