use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Egg {
  pub id: Uuid,
  pub name: String,
  pub description: Option<String>,
  pub docker_image: String,
  pub startup: String,
  pub config_files: serde_json::Value,
  pub config_startup: serde_json::Value,
  pub created_at: OffsetDateTime,
  pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EggVariable {
  pub name: String,
  pub description: String,
  pub env_variable: String,
  pub default_value: String,
  pub user_viewable: bool,
  pub user_editable: bool,
  pub rules: String,
}
