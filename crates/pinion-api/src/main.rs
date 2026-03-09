use axum::{
  Router,
  routing::{delete, get, post},
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
use crate::routes::{allocations, auth, eggs, files, nodes, remote, servers, users, ws};
use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // Initialize tracing
  tracing_subscriber::registry()
    .with(
      tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| "pinion=debug,tower_http=info".into()),
    )
    .with(tracing_subscriber::fmt::layer())
    .init();

  // Load conf
  let config = Config::load().expect("Failed to load configuration");
  let listen_addr = config.listen_addr.parse::<SocketAddr>()?;

  // Connect to db
  let pool = pinion_db::connect(&config.database_url).await?;

  // Initialize AppState
  let state = AppState::new(pool, config.clone());

  // Setup CORS
  let cors = CorsLayer::new()
    .allow_origin(if config.cors_origins.is_empty() {
      Any
    } else {
      // Need to map Vec<String> to origins, but for now it's ok
      Any
    })
    .allow_methods(Any)
    .allow_headers(Any);

  // Build the router
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
    .route("/api/remote/servers", get(remote::list_remote_servers))
    .route("/api/remote/servers/reset", post(remote::reset_servers_state))
    .route("/api/remote/servers/{uuid}", get(remote::get_remote_server))
    .route("/api/remote/activity", post(remote::send_activity_logs))
    .layer(cors)
    .layer(TraceLayer::new_for_http())
    .fallback(handle_404)
    .with_state(state);

  // Start server
  tracing::info!("Pinion API listening on {}", listen_addr);
  let listener = tokio::net::TcpListener::bind(listen_addr).await?;
  axum::serve(listener, app).await?;

  Ok(())
}

async fn handle_404(
  req: axum::http::Request<axum::body::Body>,
) -> impl axum::response::IntoResponse {
  tracing::warn!("404 NOT FOUND: {} {}", req.method(), req.uri());
  axum::http::StatusCode::NOT_FOUND
}
