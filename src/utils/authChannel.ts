// src/utils/authChannel.ts

type AuthEvent = "logout" | "login";

const CHANNEL_NAME = "auth_sync";

class AuthChannel {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  broadcast(event: AuthEvent) {
    if (this.channel) {
      this.channel.postMessage({ event });
    } else {
      // Fallback: localStorage event
      localStorage.setItem("auth_event", JSON.stringify({ event, t: Date.now() }));
      localStorage.removeItem("auth_event");
    }
  }

  listen(callback: (event: AuthEvent) => void) {
    if (this.channel) {
      this.channel.onmessage = (msg) => callback(msg.data.event);
    } else {
      // Fallback
      window.addEventListener("storage", (e) => {
        if (e.key === "auth_event" && e.newValue) {
          const { event } = JSON.parse(e.newValue);
          callback(event);
        }
      });
    }
  }

  close() {
    this.channel?.close();
  }
}

export const authChannel = new AuthChannel();
