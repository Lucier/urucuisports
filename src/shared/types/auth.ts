export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface JWTPayload {
  userId: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}
