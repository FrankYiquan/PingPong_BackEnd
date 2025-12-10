declare global {
  namespace Express {
    interface Request {
      user: { id: string };
    }
  }
}

export {};

export interface CreateUserBody {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
}

export interface LoginUserBody {
  email: string;
  password: string;
}

export interface startMatchBody {
  location: "Gosman" | "Shapiro" | "IBS";
  startTime: string; // "2025-01-01T14:00:00Z" => new Date(startTime)
  endTime: string;
  playerCount?: 2 | 4;
}

export interface matchRequestBody {
  matchRequestId: string;
}

export interface matchRequestParams {
  id: string;
}




