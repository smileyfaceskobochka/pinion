use pinion_core::error::PinionResult;
use pinion_core::models::Allocation;
use sqlx::{Executor, Postgres, Row};
use uuid::Uuid;

pub struct AllocationRepo;

impl AllocationRepo {
  pub async fn find_by_id<'a, E>(executor: E, id: Uuid) -> PinionResult<Allocation>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row =
      sqlx::query("SELECT id, node_id, ip, port, server_id, notes FROM allocations WHERE id = $1")
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::AllocationNotFound(id))?;

    Ok(Allocation {
      id: row.get("id"),
      node_id: row.get("node_id"),
      ip: row.get("ip"),
      port: row.get::<i32, _>("port") as u16,
      server_id: row.get("server_id"),
      notes: row.get("notes"),
    })
  }

  pub async fn create<'a, E>(
    executor: E,
    node_id: Uuid,
    ip: &str,
    port: u16,
  ) -> PinionResult<Allocation>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "INSERT INTO allocations (node_id, ip, port) VALUES ($1, $2, $3) RETURNING id, node_id, ip, port, server_id, notes"
        )
        .bind(node_id)
        .bind(ip)
        .bind(port as i32)
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(Allocation {
      id: row.get("id"),
      node_id: row.get("node_id"),
      ip: row.get("ip"),
      port: row.get::<i32, _>("port") as u16,
      server_id: row.get("server_id"),
      notes: row.get("notes"),
    })
  }

  pub async fn list_by_node<'a, E>(executor: E, node_id: Uuid) -> PinionResult<Vec<Allocation>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
      "SELECT id, node_id, ip, port, server_id, notes FROM allocations WHERE node_id = $1",
    )
    .bind(node_id)
    .fetch_all(executor)
    .await
    .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(
      rows
        .into_iter()
        .map(|row| Allocation {
          id: row.get("id"),
          node_id: row.get("node_id"),
          ip: row.get("ip"),
          port: row.get::<i32, _>("port") as u16,
          server_id: row.get("server_id"),
          notes: row.get("notes"),
        })
        .collect(),
    )
  }

  pub async fn assign<'a, E>(executor: E, id: Uuid, server_id: Uuid) -> PinionResult<()>
  where
    E: Executor<'a, Database = Postgres>,
  {
    sqlx::query("UPDATE allocations SET server_id = $1 WHERE id = $2")
      .bind(server_id)
      .bind(id)
      .execute(executor)
      .await
      .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(())
  }

  pub async fn find_available<'a, E>(executor: E, node_id: Uuid) -> PinionResult<Allocation>
  where
    E: Executor<'a, Database = Postgres>,
  {
    // Must be called within a transaction with FOR UPDATE
    let row = sqlx::query(
            "SELECT id, node_id, ip, port, server_id, notes FROM allocations WHERE node_id = $1 AND server_id IS NULL LIMIT 1 FOR UPDATE"
        )
        .bind(node_id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::NoAllocationsAvailable(node_id))?;

    Ok(Allocation {
      id: row.get("id"),
      node_id: row.get("node_id"),
      ip: row.get("ip"),
      port: row.get::<i32, _>("port") as u16,
      server_id: row.get("server_id"),
      notes: row.get("notes"),
    })
  }
}
