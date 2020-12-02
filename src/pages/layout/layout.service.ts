import { request } from 'umi';
import { me } from '@/dtos/user.dto';

export interface initialState {
  me?: me;
}

export async function getMe() {
  return request('/api/auth/me');
}

export async function logout() {
  return request('/api/auth/logout');
}
