export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  sessionId?: string;
};
