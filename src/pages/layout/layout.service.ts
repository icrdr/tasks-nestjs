import { request } from 'umi';

export interface currentUser {
  avatar?: string;
  username?: string;
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

export async function getCurrentUser() {
  return request('/api/auth/currentUser');
}

export async function logout() {
  return request('/api/auth/logout');
}
