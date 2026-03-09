use pinion_core::error::PinionResult;
use pinion_core::models::{Node, NodeScheme};
use sqlx::{Executor, Postgres, Row};
use uuid::Uuid;

pub struct NodeRepo;

impl NodeRepo {
  pub async fn find_by_id<'a, E>(executor: E, id: Uuid) -> PinionResult<Node>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let row = sqlx::query(
            "SELECT id, name, fqdn, scheme, port, daemon_token, memory, disk, created_at FROM nodes WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?
        .ok_or(pinion_core::error::PinionError::NodeNotFound(id))?;

    let scheme_str: String = row.get("scheme");
    let scheme = match scheme_str.as_str() {
      "http" => NodeScheme::Http,
      "https" => NodeScheme::Https,
      _ => {
        return Err(pinion_core::error::PinionError::Internal(format!(
          "Invalid NodeScheme: {}",
          scheme_str
        )));
      }
    };

    Ok(Node {
      id: row.get("id"),
      name: row.get("name"),
      fqdn: row.get("fqdn"),
      scheme,
      port: row.get::<i32, _>("port") as u16,
      daemon_token: row.get("daemon_token"),
      memory: row.get::<i64, _>("memory") as u64,
      disk: row.get::<i64, _>("disk") as u64,
      created_at: row.get("created_at"),
    })
  }

  pub async fn create<'a, E>(
    executor: E,
    name: &str,
    fqdn: &str,
    scheme: NodeScheme,
    port: u16,
    daemon_token: &str,
    memory: u64,
    disk: u64,
  ) -> PinionResult<Node>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let scheme_str = match scheme {
      NodeScheme::Http => "http",
      NodeScheme::Https => "https",
    };

    let row = sqlx::query(
            "INSERT INTO nodes (name, fqdn, scheme, port, daemon_token, memory, disk) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, fqdn, scheme, port, daemon_token, memory, disk, created_at"
        )
        .bind(name)
        .bind(fqdn)
        .bind(scheme_str)
        .bind(port as i32)
        .bind(daemon_token)
        .bind(memory as i64)
        .bind(disk as i64)
        .fetch_one(executor)
        .await
        .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(Node {
      id: row.get("id"),
      name: row.get("name"),
      fqdn: row.get("fqdn"),
      scheme,
      port: row.get::<i32, _>("port") as u16,
      daemon_token: row.get("daemon_token"),
      memory: row.get::<i64, _>("memory") as u64,
      disk: row.get::<i64, _>("disk") as u64,
      created_at: row.get("created_at"),
    })
  }

  pub async fn list<'a, E>(executor: E) -> PinionResult<Vec<Node>>
  where
    E: Executor<'a, Database = Postgres>,
  {
    let rows = sqlx::query(
      "SELECT id, name, fqdn, scheme, port, daemon_token, memory, disk, created_at FROM nodes",
    )
    .fetch_all(executor)
    .await
    .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    let mut nodes = Vec::new();
    for row in rows {
      let scheme_str: String = row.get("scheme");
      let scheme = match scheme_str.as_str() {
        "http" => NodeScheme::Http,
        "https" => NodeScheme::Https,
        _ => {
          return Err(pinion_core::error::PinionError::Internal(format!(
            "Invalid NodeScheme: {}",
            scheme_str
          )));
        }
      };

      nodes.push(Node {
        id: row.get("id"),
        name: row.get("name"),
        fqdn: row.get("fqdn"),
        scheme,
        port: row.get::<i32, _>("port") as u16,
        daemon_token: row.get("daemon_token"),
        memory: row.get::<i64, _>("memory") as u64,
        disk: row.get::<i64, _>("disk") as u64,
        created_at: row.get("created_at"),
      });
    }

    Ok(nodes)
  }

  pub async fn delete<'a, E>(executor: E, id: Uuid) -> PinionResult<()>
  where
    E: Executor<'a, Database = Postgres>,
  {
    sqlx::query("DELETE FROM nodes WHERE id = $1")
      .bind(id)
      .execute(executor)
      .await
      .map_err(|e| pinion_core::error::PinionError::Database(e.to_string()))?;

    Ok(())
  }
}
