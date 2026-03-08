import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";

export const Route = createFileRoute("/servers/$serverId/")({
  component: ServerConsole,
});

function ServerConsole() {
  const { serverId } = useParams({ from: "/servers/$serverId/" });
  const { token } = useAuth();
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !token) return;

    // Initialize Terminal with professional high-contrast theme
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
        cursor: "#4f46e5",
        selectionBackground: "rgba(79, 70, 229, 0.3)",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.2,
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/servers/${serverId}/ws?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln("\x1b[1;32m● SYSTEM: SESSION ESTABLISHED\x1b[0m");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === "console output") {
        term.write(msg.args[0]);
      } else if (msg.event === "status") {
        term.writeln(`\r\n\x1b[1;33m● STATUS: ${msg.args[0].toUpperCase()}\x1b[0m`);
      }
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[1;31m● SYSTEM: SESSION DISCONNECTED\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "send command", args: [data] }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [serverId, token]);

  const sendPowerAction = async (action: string) => {
    try {
      await apiFetch(`/api/servers/${serverId}/power`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }, token);
    } catch (err: any) {
      xtermRef.current?.writeln(`\r\n\x1b[1;31m✖ Error: ${err.message}\x1b[0m`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Power Controls - Explicit & Accessible */}
      <div className="flex flex-wrap gap-3 p-4 bg-neutral-900/50 border border-border-subtle rounded-xl">
        <PowerButton label="Start" variant="success" onClick={() => sendPowerAction("start")} />
        <PowerButton label="Restart" variant="warning" onClick={() => sendPowerAction("restart")} />
        <PowerButton label="Stop" variant="danger" onClick={() => sendPowerAction("stop")} />
        <PowerButton label="Kill" variant="kill" onClick={() => sendPowerAction("kill")} />
      </div>

      {/* Terminal Shell Container */}
      <div className="bg-black border border-border-strong rounded-xl overflow-hidden p-1 shadow-2xl h-[550px]">
        <div className="bg-neutral-900 border-b border-border-strong px-4 py-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
          </div>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Interactive Shell</span>
        </div>
        <div ref={terminalRef} className="h-[calc(100%-40px)] w-full p-2" />
      </div>
    </div>
  );
}

function PowerButton({ label, variant, onClick }: { label: string; variant: string; onClick: () => void }) {
  const styles: Record<string, string> = {
    success: "bg-green-600 hover:bg-green-500 text-white shadow-green-900/20",
    warning: "bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-900/20",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20",
    kill: "bg-neutral-800 hover:bg-neutral-700 text-white border border-border-strong",
  };

  return (
    <button
      onClick={onClick}
      className={`${styles[variant]} px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 shadow-lg active:scale-95`}
    >
      {label}
    </button>
  );
}
