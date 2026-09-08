import { TelemetryEvent } from '../types';

export class EdgeWakeSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private intentionallyClosed = false;

  public onMessage?: (event: TelemetryEvent) => void;
  public onStateChange?: (state: 'connected' | 'connecting' | 'disconnected' | 'error') => void;

  constructor(url: string) {
    this.url = url;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }

    this.intentionallyClosed = false;
    this.isConnecting = true;
    this.notifyState('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyState('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TelemetryEvent;
          if (this.onMessage) {
            this.onMessage(data);
          }
        } catch (err) {
          console.error('[EdgeWake WS] Failed to parse incoming telemetry message:', err);
          if (this.onMessage) {
            this.onMessage({
              type: 'error',
              code: 'MALFORMED_JSON',
              message: 'Failed to parse telemetry message',
            });
          }
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.intentionallyClosed) {
          this.handleReconnect();
        } else {
          this.notifyState('disconnected');
        }
      };

      this.ws.onerror = (err) => {
        console.error('[EdgeWake WS] WebSocket error:', err);
        // The onclose handler will take care of reconnecting
        this.notifyState('error');
      };
    } catch (err) {
      console.error('[EdgeWake WS] Connection initialization failed:', err);
      this.handleReconnect();
    }
  }

  public disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyState('disconnected');
  }

  private handleReconnect() {
    if (this.intentionallyClosed) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      this.notifyState('connecting');
      console.log(`[EdgeWake WS] Reconnecting in ${backoffMs}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.connect();
      }, backoffMs);
    } else {
      console.error('[EdgeWake WS] Max reconnect attempts reached.');
      this.notifyState('error');
    }
  }

  private notifyState(state: 'connected' | 'connecting' | 'disconnected' | 'error') {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }
}
