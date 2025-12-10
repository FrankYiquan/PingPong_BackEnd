export type NotifyEvent =
  | "MATCH_FOUND"
  | "MATCH_CONFIRMED"
  | "MATCH_DECLINED"
  | "MATCH_EXPIRED"
  | "MATCH_CANCELLED"
  | "MATCH_QR_CODE_CREATED"

// Notifier interface for sending notifications to users
// socket.io will wrap it
export interface Notifier {
  notifyUser: (userId: string, event: NotifyEvent, payload: any) => Promise<void>;
}
