export interface CurrentUser {
  id: number;
  username: string;
}

export interface RequestWithUser extends Request {
  user: CurrentUser;
  cookies: Record<string, string | undefined>;
}
