import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useAuth } from "../../../context/auth";
import { apiFetch } from "../../../lib/api";
import { AsciiBox } from "../../../components/AsciiBox";

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

    // Initialize Terminal with Catppuccin Mocha theme matches
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e2e", // Base
        foreground: "#cdd6f4", // Text
        cursor: "#cba6f7",     // Mauve
        selectionBackground: "rgba(137, 180, 250, 0.3)", // Blue/30
        black: "#45475a",      // Surface1
        brightBlack: "#585b70",
        red: "#f38ba8",
        brightRed: "#f38ba8",
        green: "#a6e3a1",
        brightGreen: "#a6e3a1",
        yellow: "#f9e2af",
        brightYellow: "#f9e2af",
        blue: "#89b4fa",
        brightBlue: "#89b4fa",
        magenta: "#cba6f7",
        brightMagenta: "#cba6f7",
        cyan: "#94e2d5",
        brightCyan: "#94e2d5",
        white: "#bac2de",
        brightWhite: "#a6adc8",
      },
      fontFamily: '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
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
      term.writeln("\r\n\x1b[1;32m*** CONNECTION SECURED: ORCHESTRATION NODE ***\x1b[0m\r\n");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.event === "console output") {
        term.write(msg.args[0]);
      } else if (msg.event === "status") {
        term.writeln(`\r\n\x1b[1;33m*** DAEMON STATUS: ${msg.args[0].toUpperCase()} ***\x1b[0m\r\n`);
      }
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[1;31m*** CONNECTION SEVERED: DAEMON UNREACHABLE ***\x1b[0m\r\n");
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
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        xtermRef.current?.writeln(`\r\n\x1b[1;34m> Executing lifecycle hook: ${action.toUpperCase()}\x1b[0m`);
      }
      await apiFetch(`/api/servers/${serverId}/power`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }, token);
    } catch (err: any) {
      xtermRef.current?.writeln(`\r\n\x1b[1;31mERR: SIGNAL FAILED - ${err.message}\x1b[0m`);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Power Controls */}
      <div className="flex flex-wrap gap-4 text-xs font-bold pt-2">
        <span className="text-surface2">EXEC:</span>
        <button onClick={() => sendPowerAction("start")} className="text-green hover:underline decoration-green underline-offset-4">
          [ START ]
        </button>
        <button onClick={() => sendPowerAction("restart")} className="text-yellow hover:underline decoration-yellow underline-offset-4">
          [ RESTART ]
        </button>
        <button onClick={() => sendPowerAction("stop")} className="text-red hover:underline decoration-red underline-offset-4">
          [ STOP ]
        </button>
        <button onClick={() => sendPowerAction("kill")} className="text-mauve hover:bg-mauve hover:text-base px-2 uppercase font-black">
          [ KILL -9 ]
        </button>
      </div>

      {/* Embedded Terminal */}
      <AsciiBox borderColor="border-surface2" className="p-0">
        <div className="bg-crust border-b border-surface1 px-2 py-1 flex justify-between">
          <span className="text-subtext0 text-xs">/dev/ttyS0</span>
          <span className="text-surface2 text-xs">115200 8N1</span>
        </div>
        <div ref={terminalRef} className="h-[600px] w-full p-2" />
      </AsciiBox>

    </div>
  );
}
