export type UserRole = 'ADMIN' | 'PROFISSIONAL' | 'CLIENTE';

export interface UserRoles {
  roles: UserRole[];
  isAdmin: boolean;
  isProfissional: boolean;
  isCliente: boolean;
}
