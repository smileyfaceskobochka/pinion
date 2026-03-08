use axum::{
  routing::{delete, get, post},
  Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod error;
mod middleware;
mod routes;
mod state;

use crate::config::Config;
use crate::routes::{allocations, auth, eggs, files, nodes, servers, users, ws};
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // 1. Initialize tracing
  tracing_subscriber::registry()
    .with(
      tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "pinion=debug,tower_http=info".into()),
    )
    .with(tracing_subscriber::fmt::layer())
    .init();

  // 2. Load configuration
  let config = Config::load().expect("Failed to load configuration");
  let listen_addr = config.listen_addr.parse::<SocketAddr>()?;

  // 3. Connect to database
  let pool = pinion_db::connect(&config.database_url).await?;

  // 4. Initialize application state
  let state = AppState::new(pool, config.clone());

  // 5. Setup CORS
  let cors = CorsLayer::new()
    .allow_origin(if config.cors_origins.is_empty() {
      Any
    } else {
      // Need to map Vec<String> to origins, but Any is safer for homelab dev
      Any
    })
    .allow_methods(Any)
    .allow_headers(Any);

  // 6. Build the router
  let app = Router::new()
    .route("/api/auth/login", post(auth::login))
    .route("/api/auth/register", post(auth::register))
    .route("/api/users", get(users::list_users).post(users::create_user))
    .route("/api/nodes", get(nodes::list_nodes).post(nodes::create_node))
    .route("/api/nodes/{id}", delete(nodes::delete_node))
    .route("/api/nodes/{node_id}/allocations", get(allocations::list_node_allocations))
    .route("/api/allocations", post(allocations::create_allocation))
    .route("/api/servers", get(servers::list_servers).post(servers::create_server))
    .route("/api/servers/{id}/power", post(servers::set_power))
    .route("/api/servers/{uuid}/ws", get(ws::console_ws))
    .route("/api/servers/{id}/files", get(files::list_files))
    .route("/api/servers/{id}/files/content", get(files::read_file).post(files::write_file))
    .route("/api/eggs", get(eggs::list_eggs).post(eggs::upsert_egg))
    .layer(cors)
    .layer(TraceLayer::new_for_http())
    .with_state(state);

  // 7. Start the server
  tracing::info!("Pinion API listening on {}", listen_addr);
  let listener = tokio::net::TcpListener::bind(listen_addr).await?;
  axum::serve(listener, app).await?;

  Ok(())
}
