import { request } from 'umi';
import { CurrentUserRes } from '@dtos/user.dto';
import OSS from 'ali-oss';
import { StsTokenRes } from '@dtos/asset.dto';
import moment from 'moment';
import { AddSpaceDTO, GetSpacesDTO, SpaceDetailRes, SpaceListRes } from '@dtos/space.dto';

export interface initialState {
  currentUser: CurrentUserRes;
  currentSpace: SpaceDetailRes;
}

export async function getCurrentUser(): Promise<CurrentUserRes> {
  return request('/api/auth/currentUser');
}

export async function getStsToken(): Promise<StsTokenRes> {
  return request('/api/oss');
}

export async function logout(): Promise<void> {
  return request('/api/auth/logout');
}

export async function getSpaces(params?: GetSpacesDTO): Promise<SpaceListRes> {
  return request('/api/spaces', { params });
}

export async function getSpace(id: number): Promise<SpaceDetailRes> {
  return request(`/api/spaces/${id}`);
}

export const addSpace = async (body: AddSpaceDTO): Promise<SpaceDetailRes> => {
  return request('/api/spaces/', {
    method: 'POST',
    data: body,
  });
};

export async function getOssClient(): Promise<OSS> {
  const stsTokenString = localStorage.getItem('stsToken');
  if (stsTokenString) {
    const stsToken = JSON.parse(stsTokenString) as StsTokenRes;
    if (moment(stsToken.expiration) > moment()) {
      return new OSS(stsToken);
    }
  }

  const res = await request('/api/oss');
  localStorage.setItem('stsToken', JSON.stringify(res));
  return new OSS(res);
}
