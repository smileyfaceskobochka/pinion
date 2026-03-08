use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PowerAction {
  Start,
  Stop,
  Restart,
  Kill,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsServerConfig {
  pub uuid: Uuid,
  pub start_on_completion: bool,
  pub skip_scripts: bool,
  pub environment: HashMap<String, String>,
  pub invocation: String,
  pub build: WingsBuildConfig,
  pub container: WingsContainerConfig,
  pub allocations: WingsAllocationConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsBuildConfig {
  pub memory: u64,
  pub swap: i64,
  pub disk: u64,
  pub io: u64,
  pub cpu: u64,
  pub threads: u32,
  pub oom_disabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsContainerConfig {
  pub image: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsAllocationConfig {
  pub default: WingsAllocation,
  pub additional: Vec<WingsAllocation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsAllocation {
  pub ip: String,
  pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStats {
  pub state: String,
  pub memory_bytes: u64,
  pub memory_limit_bytes: u64,
  pub cpu_absolute: f64,
  pub network: NetworkStats,
  pub uptime: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
  pub rx_bytes: u64,
  pub tx_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WsMessage {
  pub event: String,
  pub args: Option<Vec<String>>,
}
