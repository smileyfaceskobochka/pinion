use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
  pub id: Uuid,
  pub name: String,
  pub description: Option<String>,
  pub owner_id: Uuid,
  pub node_id: Uuid,
  pub allocation_id: Uuid,
  pub egg_id: Uuid,
  pub status: ServerState,
  pub limits: ServerLimits,
  pub environment: HashMap<String, String>,
  pub startup_override: Option<String>,
  pub created_at: OffsetDateTime,
  pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ServerState {
  Installing,
  InstallFailed,
  Offline,
  Starting,
  Running,
  Stopping,
  Suspended,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ServerLimits {
  pub memory: u64,  // MiB, 0 = unlimited
  pub disk: u64,    // MiB
  pub cpu: u64,     // % of one thread, 0 = unlimited
  pub io: u64,      // blkio weight 10-1000
  pub swap: i64,    // MiB, -1 = unlimited, 0 = disabled
  pub threads: u32, // 0 = all
}
