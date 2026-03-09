use crate::error::ApiResult;
use crate::state::AppState;
use axum::{Json, extract::State};
use pinion_db::repos::{AllocationRepo, EggRepo, ServerRepo};
use pinion_wings::types::{
  ProcessConfiguration, StartupConfiguration, StopConfiguration, WingsAllocation,
  WingsAllocationConfig, WingsBuildConfig, WingsContainerConfig, WingsEggConfig, WingsMeta,
  WingsServerConfigurationResponse, WingsSettings,
};
use serde::Serialize;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Serialize)]
pub struct RemoteServersResponse {
  pub data: Vec<WingsServerConfigurationResponse>,
}

pub async fn list_remote_servers(
  State(state): State<AppState>,
) -> ApiResult<Json<RemoteServersResponse>> {
  let servers = ServerRepo::list(&state.pool, 1000, 0).await?;
  let mut data = Vec::new();

  for server in servers {
    let egg = EggRepo::find_by_id(&state.pool, server.egg_id).await?;
    let allocation = AllocationRepo::find_by_id(&state.pool, server.allocation_id).await?;

    data.push(WingsServerConfigurationResponse {
      settings: WingsSettings {
        uuid: server.id,
        meta: WingsMeta {
          name: server.name.clone(),
          description: server.description.clone().unwrap_or_default(),
        },
        suspended: false,
        invocation: egg.startup.clone(),
        skip_scripts: false,
        environment: server
          .environment
          .iter()
          .map(|(k, v)| (k.clone(), serde_json::Value::String(v.clone())))
          .collect(),
        labels: HashMap::new(),
        allocations: WingsAllocationConfig {
          force_outgoing_ip: false,
          default: WingsAllocation { ip: allocation.ip.clone(), port: allocation.port },
          mappings: {
            let mut m = HashMap::new();
            m.insert(allocation.ip.clone(), vec![allocation.port]);
            m
          },
        },
        build: WingsBuildConfig {
          memory_limit: server.limits.memory,
          swap: server.limits.swap,
          io_weight: server.limits.io as u16,
          cpu_limit: server.limits.cpu,
          disk_space: server.limits.disk,
          threads: if server.limits.threads > 0 {
            Some(server.limits.threads.to_string())
          } else {
            None
          },
          oom_killer: true,
        },
        egg: WingsEggConfig {
          id: egg.id,
          file_denylist: vec![],
          features: serde_json::Value::Object(serde_json::Map::new()),
        },
        container: WingsContainerConfig { image: egg.docker_image.clone() },
      },
      process_configuration: ProcessConfiguration {
        startup: StartupConfiguration {
          done: vec!["regex:.*".to_string()], // Placeholder, Wings needs at least one line matcher
          user_interaction: vec![],
          strip_ansi: false,
        },
        stop: StopConfiguration { kind: "stop".to_string(), value: "stop".to_string() },
        configs: vec![],
      },
    });
  }

  Ok(Json(RemoteServersResponse { data }))
}

pub async fn get_remote_server(
  State(state): State<AppState>,
  axum::extract::Path(uuid): axum::extract::Path<Uuid>,
) -> ApiResult<Json<WingsServerConfigurationResponse>> {
  tracing::info!("Wings synchronization request for server: {}", uuid);
  let server = match ServerRepo::find_by_id(&state.pool, uuid).await {
    Ok(s) => s,
    Err(e) => {
      tracing::error!("Server {} not found for Wings: {:?}", uuid, e);
      return Err(e.into());
    }
  };

  let egg = EggRepo::find_by_id(&state.pool, server.egg_id).await?;
  let allocation = AllocationRepo::find_by_id(&state.pool, server.allocation_id).await?;

  tracing::info!("Successfully retrieved configuration for server: {}", uuid);

  Ok(Json(WingsServerConfigurationResponse {
    settings: WingsSettings {
      uuid: server.id,
      meta: WingsMeta {
        name: server.name.clone(),
        description: server.description.clone().unwrap_or_default(),
      },
      suspended: false,
      invocation: egg.startup.clone(),
      skip_scripts: false,
      environment: server
        .environment
        .iter()
        .map(|(k, v)| (k.clone(), serde_json::Value::String(v.clone())))
        .collect(),
      labels: HashMap::new(),
      allocations: WingsAllocationConfig {
        force_outgoing_ip: false,
        default: WingsAllocation { ip: allocation.ip.clone(), port: allocation.port },
        mappings: {
          let mut m = HashMap::new();
          m.insert(allocation.ip.clone(), vec![allocation.port]);
          m
        },
      },
      build: WingsBuildConfig {
        memory_limit: server.limits.memory,
        swap: server.limits.swap,
        io_weight: server.limits.io as u16,
        cpu_limit: server.limits.cpu,
        disk_space: server.limits.disk,
        threads: if server.limits.threads > 0 {
          Some(server.limits.threads.to_string())
        } else {
          None
        },
        oom_killer: true,
      },
      egg: WingsEggConfig {
        id: egg.id,
        file_denylist: vec![],
        features: serde_json::Value::Object(serde_json::Map::new()),
      },
      container: WingsContainerConfig { image: egg.docker_image.clone() },
    },
    process_configuration: ProcessConfiguration {
      startup: StartupConfiguration {
        done: vec!["regex:.*".to_string()],
        user_interaction: vec![],
        strip_ansi: false,
      },
      stop: StopConfiguration { kind: "stop".to_string(), value: "stop".to_string() },
      configs: vec![],
    },
  }))
}

pub async fn reset_servers_state() -> axum::http::StatusCode {
  tracing::info!("Wings requested server state reset");
  axum::http::StatusCode::NO_CONTENT
}

pub async fn send_activity_logs() -> axum::http::StatusCode {
  // We can implement activity tracking later
  axum::http::StatusCode::NO_CONTENT
}
