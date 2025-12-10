export type Location = "Gosman" | "Shapiro" | "IBS";

export type MatchRequestStatus =
  | "searching"
  | "pending_confirmation"
  | "matched"
  | "expired"
  | "waitlisted"
  | "cancelled";

export type imageOptions = "pic1" | "pic2" | "pic3" | "pic4";

export interface RedisMatchRequest {
  matchRequestId: string;          // Mongo _id as string
  userId: string;                  // Mongo user _id
  location: Location;
  startTimeMs: number;             // timestamp (ms)
  endTimeMs: number;               // timestamp (ms)
  elo: number;
  creditScore: number;
  profileImage: string;
  username: string;
  playerCount: 2 | 4;               // if you support doubles later
  createdAtMs: number;             // when the search started
  avatar: imageOptions; // added for avatar selection
}
