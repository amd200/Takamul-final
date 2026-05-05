type AuthEvent = "logout" | "login";

const CHANNEL_NAME = "auth_sync";

class AuthChannel {
  private channel: BroadcastChannel | null = null;
  private isClosed = false;

  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  private ensureOpen() {
    if (this.isClosed || !this.channel) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.isClosed = false;
    }
  }

  broadcast(event: AuthEvent) {
    if (typeof BroadcastChannel !== "undefined") {
      this.ensureOpen();
      this.channel?.postMessage({ event });
    } else {
      localStorage.setItem("auth_event", JSON.stringify({ event, t: Date.now() }));
      localStorage.removeItem("auth_event");
    }
  }

  listen(callback: (event: AuthEvent) => void) {
    if (typeof BroadcastChannel !== "undefined") {
      this.ensureOpen();
      if (this.channel) {
        this.channel.onmessage = (msg) => callback(msg.data.event);
      }
    } else {
      window.addEventListener("storage", (e) => {
        if (e.key === "auth_event" && e.newValue) {
          const { event } = JSON.parse(e.newValue);
          callback(event);
        }
      });
    }
  }
}

export const authChannel = new AuthChannel();
