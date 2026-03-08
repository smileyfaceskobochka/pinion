use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Egg {
  pub id: Uuid,
  pub name: String,
  pub author: String,
  pub description: Option<String>,
  pub docker_image: String,
  pub startup: String,
  pub config: serde_json::Value,
  pub variables: serde_json::Value,
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
