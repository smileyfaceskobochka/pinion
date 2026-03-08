use crate::error::{WingsError, WingsResult};
use crate::jwt::issue_ws_token;
use crate::types::WsMessage;
use futures_util::{SinkExt, StreamExt};
use pinion_core::models::Node;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use uuid::Uuid;

pub struct WingsWsProxy {
  node: Node,
  server_uuid: Uuid,
}

impl WingsWsProxy {
  pub fn new(node: Node, server_uuid: Uuid) -> Self {
    Self { node, server_uuid }
  }

  pub async fn connect(&self) -> WingsResult<WingsWsHandle> {
    let ws_url = self.node.ws_url(&self.server_uuid);
    let (ws_stream, _) =
      connect_async(&ws_url).await.map_err(|e| WingsError::Unreachable(e.to_string()))?;

    Ok(WingsWsHandle {
      inner: ws_stream,
      server_uuid: self.server_uuid,
      daemon_token: self.node.daemon_token.clone(),
    })
  }
}

pub struct WingsWsHandle {
  inner:
    tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>,
  server_uuid: Uuid,
  daemon_token: String,
}

impl WingsWsHandle {
  pub async fn send(&mut self, msg: WsMessage) -> WingsResult<()> {
    let json = serde_json::to_string(&msg).map_err(|e| WingsError::Parse(e.to_string()))?;
    self
      .inner
      .send(Message::Text(json.into()))
      .await
      .map_err(|e| WingsError::Unreachable(e.to_string()))
  }

  pub async fn recv(&mut self) -> WingsResult<Option<WsMessage>> {
    while let Some(msg) = self.inner.next().await {
      let msg = msg.map_err(|e| WingsError::Unreachable(e.to_string()))?;

      match msg {
        Message::Text(text) => {
          let ws_msg: WsMessage =
            serde_json::from_str(&text).map_err(|e| WingsError::Parse(e.to_string()))?;

          // Handle transparent token refresh
          if ws_msg.event == "token expiring" {
            tracing::info!("Wings token expiring, re-authenticating...");
            let new_token = issue_ws_token(self.server_uuid, &self.daemon_token, 600)?;
            self.send(WsMessage { event: "auth".to_string(), args: Some(vec![new_token]) }).await?;
            continue; // Wait for the next actual message
          }

          return Ok(Some(ws_msg));
        }
        Message::Close(_) => return Ok(None),
        _ => continue,
      }
    }
    Ok(None)
  }

  /// Run a bidirectional proxy between this Wings handle and an Axum WebSocket.
  pub async fn proxy(mut self, mut axum_ws: axum::extract::ws::WebSocket) -> WingsResult<()> {
    use axum::extract::ws::Message as AxumMessage;

    loop {
      tokio::select! {
          // Wings -> Axum
          wings_msg = self.recv() => {
              match wings_msg? {
                  Some(msg) => {
                      let json = serde_json::to_string(&msg).map_err(|e| WingsError::Parse(e.to_string()))?;
                      axum_ws.send(AxumMessage::Text(json.into())).await.map_err(|e| WingsError::Unreachable(e.to_string()))?;
                  }
                  None => break,
              }
          }
          // Axum -> Wings
          axum_msg = axum_ws.recv() => {
              match axum_msg {
                  Some(Ok(AxumMessage::Text(text))) => {
                      let ws_msg: WsMessage = serde_json::from_str(&text).map_err(|e| WingsError::Parse(e.to_string()))?;
                      self.send(ws_msg).await?;
                  }
                  Some(Ok(AxumMessage::Close(_))) | None => break,
                  _ => continue,
              }
          }
      }
    }

    Ok(())
  }
}
