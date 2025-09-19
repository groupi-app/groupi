export interface WebSocketProvider {
  subscribe(channel: string): void;
  unsubscribe(channel: string): void;
  bind(event: string, callback: () => void): void;
  unbind(event: string, callback: () => void): void;
  disconnect?(): void;
}
