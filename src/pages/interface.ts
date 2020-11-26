export interface currentUser {
  avatar?: string;
  name?: string;
  title?: string;
  group?: string;
  signature?: string;
  tags?: {
    key: string;
    label: string;
  }[];
  userid?: string;
  access?: 'user' | 'guest' | 'admin';
  unreadCount?: number;
}

export interface initialState {
  currentUser?: currentUser;
}
