import OSS from 'ali-oss';
import { request } from 'umi';

export interface currentUser {
  id: number;
  username: string;
  perms: string[];
}

export interface initialState {
  currentUser?: currentUser;
  ossClient?: OSS;
}

export async function getCurrentUser() {
  return request('/api/auth/currentUser');
}

export async function logout() {
  return request('/api/auth/logout');
}
