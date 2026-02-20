export interface SignupRequest {
  username: string;
  password: string;
  access_code?: string;
}

export interface SigninRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  created_at: string;
}
