use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
  pub id: Uuid,
  pub name: String,
  pub fqdn: String,
  pub scheme: NodeScheme,
  pub port: u16,
  #[serde(skip_serializing)]
  pub daemon_token: String,
  pub memory: u64,
  pub disk: u64,
  pub created_at: OffsetDateTime,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum NodeScheme {
  Http,
  Https,
}

impl Node {
  pub fn api_url(&self) -> String {
    let scheme = match self.scheme {
      NodeScheme::Http => "http",
      NodeScheme::Https => "https",
    };
    format!("{}://{}:{}/api", scheme, self.fqdn, self.port)
  }

  pub fn ws_url(&self, server_uuid: &Uuid) -> String {
    let scheme = match self.scheme {
      NodeScheme::Http => "ws",
      NodeScheme::Https => "wss",
    };
    format!("{}://{}:{}/api/servers/{}/ws", scheme, self.fqdn, self.port, server_uuid)
  }
}
