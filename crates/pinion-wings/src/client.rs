use crate::error::{WingsError, WingsResult};
use crate::types::{PowerAction, WingsServerConfig};
use pinion_core::models::Node;
use reqwest::{Client, StatusCode};
use uuid::Uuid;

pub struct WingsClient {
  http: Client,
  base_url: String,
  daemon_token: String,
}

impl WingsClient {
  pub fn new(node: &Node) -> Self {
    Self { http: Client::new(), base_url: node.api_url(), daemon_token: node.daemon_token.clone() }
  }

  pub fn from_node(node: &Node) -> Self {
    Self::new(node)
  }

  fn request(&self, method: reqwest::Method, path: &str) -> reqwest::RequestBuilder {
    self
      .http
      .request(method, format!("{}{}", self.base_url, path))
      .header("Authorization", format!("Bearer {}", self.daemon_token))
      .header("Content-Type", "application/json")
  }

  async fn handle_response<T: serde::de::DeserializeOwned>(
    &self,
    resp: reqwest::Response,
  ) -> WingsResult<T> {
    let status = resp.status();
    if !status.is_success() {
      let body = resp.text().await.unwrap_or_default();
      return Err(WingsError::Http { status: status.as_u16(), body });
    }

    resp.json().await.map_err(|e| WingsError::Parse(e.to_string()))
  }

  async fn handle_empty_response(&self, resp: reqwest::Response) -> WingsResult<()> {
    let status = resp.status();
    if !status.is_success() {
      let body = resp.text().await.unwrap_or_default();
      return Err(WingsError::Http { status: status.as_u16(), body });
    }
    Ok(())
  }

  pub async fn list_servers(&self) -> WingsResult<Vec<serde_json::Value>> {
    let resp = self
      .request(reqwest::Method::GET, "/servers")
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_response(resp).await
  }

  pub async fn create_server(&self, config: &WingsServerConfig) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, "/servers")
      .json(config)
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn delete_server(&self, uuid: Uuid) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::DELETE, &format!("/servers/{}", uuid))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn reinstall_server(&self, uuid: Uuid) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/reinstall", uuid))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn sync_server(&self, uuid: Uuid, config: &WingsServerConfig) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/sync", uuid))
      .json(config)
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn set_power(&self, uuid: Uuid, action: PowerAction) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/power", uuid))
      .json(&serde_json::json!({ "action": action }))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn send_command(&self, uuid: Uuid, command: &str) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/commands", uuid))
      .json(&serde_json::json!({ "commands": [command] }))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn list_files(&self, uuid: Uuid, directory: &str) -> WingsResult<serde_json::Value> {
    let resp = self
      .request(
        reqwest::Method::GET,
        &format!("/servers/{}/files/list-directory?directory={}", uuid, directory),
      )
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_response(resp).await
  }

  pub async fn get_file_contents(&self, uuid: Uuid, path: &str) -> WingsResult<String> {
    let resp = self
      .request(reqwest::Method::GET, &format!("/servers/{}/files/contents?file={}", uuid, path))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;

    if !resp.status().is_success() {
      let status = resp.status().as_u16();
      let body = resp.text().await.unwrap_or_default();
      return Err(WingsError::Http { status, body });
    }

    resp.text().await.map_err(|e| WingsError::Parse(e.to_string()))
  }

  pub async fn write_file(&self, uuid: Uuid, path: &str, contents: &str) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/files/write?file={}", uuid, path))
      .body(contents.to_string())
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn delete_files(&self, uuid: Uuid, paths: Vec<String>) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/files/delete", uuid))
      .json(&serde_json::json!({ "files": paths }))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn rename_file(&self, uuid: Uuid, from: &str, to: &str) -> WingsResult<()> {
    let resp = self
      .request(reqwest::Method::POST, &format!("/servers/{}/files/rename", uuid))
      .json(&serde_json::json!({ "files": [{ "from": from, "to": to }] }))
      .send()
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))?;
    self.handle_empty_response(resp).await
  }

  pub async fn ping(&self) -> WingsResult<bool> {
    let resp = self.http.get(&self.base_url.replace("/api", "/health")).send().await;

    match resp {
      Ok(r) => Ok(r.status() == StatusCode::OK),
      Err(_) => Ok(false),
    }
  }
}
