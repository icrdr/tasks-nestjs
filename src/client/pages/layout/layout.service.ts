import { request } from 'umi';
import { CurrentUserRes } from '@dtos/user.dto';
import OSS from 'ali-oss';
import { StsTokenRes } from '@dtos/asset.dto';

export interface initialState {
  currentUser?: CurrentUserRes;
  ossClient?: OSS;
}

export async function getCurrentUser(): Promise<CurrentUserRes> {
  return request('/api/auth/currentUser');
}

export async function getStsToken(): Promise<StsTokenRes> {
  return request('/api/assets/oss');
}

export async function logout(): Promise<void> {
  return request('/api/auth/logout');
}
