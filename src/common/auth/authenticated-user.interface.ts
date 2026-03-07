export type AuthenticatedUser = {
  sub: string;
  email: string;
  sessionId?: string;
};
