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
pub struct WingsServerConfigurationResponse {
  pub settings: WingsSettings,
  pub process_configuration: ProcessConfiguration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsSettings {
  pub uuid: Uuid,
  pub meta: WingsMeta,
  pub suspended: bool,
  pub invocation: String,
  #[serde(rename = "skip_egg_scripts")]
  pub skip_scripts: bool,
  pub environment: HashMap<String, serde_json::Value>,
  pub labels: HashMap<String, String>,
  pub allocations: WingsAllocationConfig,
  pub build: WingsBuildConfig,
  pub egg: WingsEggConfig,
  pub container: WingsContainerConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsMeta {
  pub name: String,
  pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsEggConfig {
  pub id: Uuid,
  pub file_denylist: Vec<String>,
  pub features: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessConfiguration {
  pub startup: StartupConfiguration,
  pub stop: StopConfiguration,
  pub configs: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupConfiguration {
  pub done: Vec<String>,
  pub user_interaction: Vec<String>,
  pub strip_ansi: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StopConfiguration {
  #[serde(rename = "type")]
  pub kind: String,
  pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsBuildConfig {
  pub memory_limit: u64,
  pub swap: i64,
  pub io_weight: u16,
  pub cpu_limit: u64,
  pub disk_space: u64,
  pub threads: Option<String>,
  pub oom_killer: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsContainerConfig {
  pub image: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WingsAllocationConfig {
  pub force_outgoing_ip: bool,
  pub default: WingsAllocation,
  pub mappings: HashMap<String, Vec<u16>>,
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
