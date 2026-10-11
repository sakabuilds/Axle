import { io, Socket } from "socket.io-client";

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "https://axle-api-q8oa.onrender.com"
).replace(/\/$/, "");

class SocketClient {
  private socket: Socket | null = null;
  private connected = false;

  connect(token?: string) {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      this.connected = true;
      console.log("✅ WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      this.connected = false;
      console.log("❌ WebSocket disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Subscribe to agent events
  subscribeToAgent(
    agentId: string,
    callbacks: {
      onExecutionStarted?: (data: any) => void;
      onActionStarted?: (data: any) => void;
      onActionCompleted?: (data: any) => void;
      onStatus?: (data: any) => void;
      onExecutionCompleted?: (data: any) => void;
      onExecutionEvent?: (data: any) => void;
      onPlan?: (data: any) => void;
      onPlanDelta?: (data: any) => void;
      onCreditsUpdated?: (data: any) => void;
    }
  ) {
    if (!this.socket) {
      console.warn("Socket not connected");
      return;
    }

    // Join backend room for this agent
    this.socket.emit("subscribe", agentId);

    const events = [
      { name: "execution:started", callback: callbacks.onExecutionStarted },
      { name: "execution:status", callback: callbacks.onStatus },
      {
        name: "execution:action",
        callback: (data: any) => {
          // Handle both started and completed actions
          if (data.status === "running") {
            callbacks.onActionStarted?.(data);
          } else if (data.status === "completed") {
            callbacks.onActionCompleted?.(data);
          }
        },
      },
      { name: "execution:completed", callback: callbacks.onExecutionCompleted },
      { name: "execution:event", callback: callbacks.onExecutionEvent },
      { name: "execution:plan", callback: callbacks.onPlan },
      { name: "execution:plan_delta", callback: callbacks.onPlanDelta },
      {
        name: "execution:reasoning_delta",
        callback: (data: any) => {
          // Mark as reasoning type
          callbacks.onPlanDelta?.({
            ...data,
            type: "reasoning",
            eventType: "reasoning_delta",
          });
        },
      },
      { name: "execution:response_delta", callback: callbacks.onPlanDelta }, // For streaming text responses
      { name: "credits-updated", callback: callbacks.onCreditsUpdated },
    ];

    events.forEach(({ name, callback }) => {
      if (callback && this.socket) {
        this.socket.on(name, callback);
      }
    });

    return () => {
      events.forEach(({ name, callback }) => {
        if (callback && this.socket) {
          this.socket.off(name, callback);
        }
      });
    };
  }

  isConnected() {
    return this.connected;
  }

  getSocket() {
    return this.socket;
  }

  /**
   * Emit a tool action from a UI card (e.g., send email, post tweet, merge PR)
   */
  emitToolAction(executionId: string, action: string, data: any) {
    if (!this.socket) {
      console.warn("Socket not connected");
      return;
    }

    this.socket.emit("tool_action", {
      executionId,
      action,
      data,
    });
  }

  /**
   * Approve a pending tool execution
   */
  emitApproval(approvalId: string) {
    if (!this.socket) {
      console.warn("Socket not connected");
      return;
    }

    this.socket.emit("approval_response", {
      approvalId,
      approved: true,
    });
  }

  /**
   * Reject a pending tool execution
   */
  emitRejection(approvalId: string, reason?: string) {
    if (!this.socket) {
      console.warn("Socket not connected");
      return;
    }

    this.socket.emit("approval_response", {
      approvalId,
      approved: false,
      reason,
    });
  }
}

export const socketClient = new SocketClient();

