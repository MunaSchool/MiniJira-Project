export interface AuthUser {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  teamId?: string | null;
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  teamId: string | null;
  user: AuthUser;
}

export interface AuthSession {
  token: string;
  role: string;
  teamId: string | null;
  user: AuthUser;
  rememberDevice: boolean;
}
