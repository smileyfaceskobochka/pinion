use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Allocation {
  pub id: Uuid,
  pub node_id: Uuid,
  pub ip: String,
  pub port: u16,
  pub server_id: Option<Uuid>,
  pub notes: Option<String>,
}

impl Allocation {
  pub fn is_assigned(&self) -> bool {
    self.server_id.is_some()
  }

  pub fn address(&self) -> String {
    format!("{}:{}", self.ip, self.port)
  }
}
