export type LoginResponse = {
  accessToken: string;  
  accessTokenExpiration: string;
  roles: string[];
};

export type LoginPayload = {
  identifier: string;
  password: string;
};
