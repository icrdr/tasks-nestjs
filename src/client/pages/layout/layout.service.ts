import { request } from 'umi';
import { CurrentUserRes } from '@dtos/user.dto';
import OSS from 'ali-oss';
import { StsTokenRes } from '@dtos/asset.dto';
import moment from 'moment';

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

export async function getOssClient(): Promise<OSS> {
  const stsTokenString = localStorage.getItem('stsToken')
  if(stsTokenString){
    const stsToken = JSON.parse(stsTokenString) as StsTokenRes
    if (moment(stsToken.expiration) > moment()) {
      return new OSS(stsToken);
    }
  }

  const res = await request('/api/assets/oss')
  console.log(res)
  localStorage.setItem('stsToken',JSON.stringify(res))
  return new OSS(res);
}
