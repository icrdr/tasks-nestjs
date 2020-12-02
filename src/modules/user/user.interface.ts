export interface currentUser {
  id: number;
  ownedPerms: string[];
  validPerms: string[];
}

export interface tokenPayload {
  id: number;
  perms: string[];
}
