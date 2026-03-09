use pinion_core::error::PinionResult;
use pinion_core::models::{Server, ServerLimits, ServerState};
use sqlx::{Executor, Postgres, Row, types::Json};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ServerRepo;

impl ServerRepo {
  fn map_row_to_server(row: sqlx::postgres::PgRow) -> PinionResult<Server> {
    let status_str: String = row.get("status");
    let status = match status_str.as_str() {
      "installing" => ServerState::Installing,
      "install_failed" => ServerState::InstallFailed,
      "offline" => ServerState::Offline,
      "starting" => ServerState::Starting,
      "running" => ServerState::Running,
      "stopping" => ServerState::Stopping,
      "suspended" => ServerState::Suspended,
      _ => {
        return Err(pinion_core::error::PinionError::Internal(format!(
          "Invalid ServerState: {}",
          status_str
        )));
      }
    };

    let env_json: Json<HashMap<String, String>> = row.get("environment");

    Ok(Server {
      id: row.get("id"),
      name: row.get("name"),
      description: row.get("description"),
      owner_id: row.get("owner_id"),
      node_id: row.get("node_id"),
      allocation_id: row.get("allocation_id"),
      egg_id: row.get("egg_id"),
      status,
      limits: ServerLimits {
        memory: row.get::<i64, _>("memory") as u64,
        disk: row.get::<i64, _>("disk") as u64,
        cpu: row.get::<i64, _>("cpu") as u64,
        io: row.get::<i64, _>("io") as u64,
        swap: row.get("swap"),
        threads: row.get::<i32, _>("threads") as u32,
      },
      environment: env_json.0,
      startup_override: row.get("startup_override"),
      created_at: row.get("created_at"),
      updated_at: row.get("updated_at"),
    })
  }

  pub async fn find_by_id<'a, E>(executor: E, id: Uuid) -> PinionResult<Server>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "SELECT id, name, description, owner_id, node_id, allocation_id, egg_id, status, memory, disk, cpu, io, swap, threads, environment, startup_override, created_at, updated_at FROM servers WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::ServerNotFound(id))?;

    Self::map_row_to_server(row)
  }

  pub async fn find_by_owner<'a, E>(executor: E, owner_id: Uuid) -> PinionResult<Vec<Server>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
            "SELECT id, name, description, owner_id, node_id, allocation_id, egg_id, status, memory, disk, cpu, io, swap, threads, environment, startup_override, created_at, updated_at FROM servers WHERE owner_id = $1"
        )
        .bind(owner_id)
        .fetch_all(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    rows.into_iter().map(Self::map_row_to_server).collect()
  }

  pub async fn create<'a, E>(
    executor: E,
    name: &str,
    description: Option<&str>,
    owner_id: Uuid,
    node_id: Uuid,
    allocation_id: Uuid,
    egg_id: Uuid,
    limits: &ServerLimits,
    environment: &HashMap<String, String>,
  ) -> PinionResult<Server>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "INSERT INTO servers (name, description, owner_id, node_id, allocation_id, egg_id, memory, disk, cpu, io, swap, threads, environment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, name, description, owner_id, node_id, allocation_id, egg_id, status, memory, disk, cpu, io, swap, threads, environment, startup_override, created_at, updated_at"
        )
        .bind(name)
        .bind(description)
        .bind(owner_id)
        .bind(node_id)
        .bind(allocation_id)
        .bind(egg_id)
        .bind(limits.memory as i64)
        .bind(limits.disk as i64)
        .bind(limits.cpu as i64)
        .bind(limits.io as i64)
        .bind(limits.swap)
        .bind(limits.threads as i32)
        .bind(Json(environment))
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Self::map_row_to_server(row)
  }

  pub async fn update_status<'a, E>(executor: E, id: Uuid, status: ServerState) -> PinionResult<()>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let status_str = match status {
      ServerState::Installing => "installing",
      ServerState::InstallFailed => "install_failed",
      ServerState::Offline => "offline",
      ServerState::Starting => "starting",
      ServerState::Running => "running",
      ServerState::Stopping => "stopping",
      ServerState::Suspended => "suspended",
    };

    sqlx::query("UPDATE servers SET status = $1, updated_at = now() WHERE id = $2")
      .bind(status_str)
      .bind(id)
      .execute(executor)
      .await
      .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(())
  }

  pub async fn delete<'a, E>(executor: E, id: Uuid) -> PinionResult<()>
  where
    E: Executor<'a, Database = Postgres>,
  {
    sqlx::query("DELETE FROM servers WHERE id = $1")
      .bind(id)
      .execute(executor)
      .await
      .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(())
  }

  pub async fn list<'a, E>(executor: E, limit: i64, offset: i64) -> PinionResult<Vec<Server>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
            "SELECT id, name, description, owner_id, node_id, allocation_id, egg_id, status, memory, disk, cpu, io, swap, threads, environment, startup_override, created_at, updated_at FROM servers LIMIT $1 OFFSET $2"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    rows.into_iter().map(Self::map_row_to_server).collect()
  }
}
