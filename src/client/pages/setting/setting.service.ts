import { request } from 'umi';
import { ChangeSpaceDTO, SpaceDetailRes } from '@dtos/space.dto';
import { AddRoleDTO, ChangeRoleDTO, GetRolesDTO, RoleListRes, RoleRes } from '@dtos/role.dto';
import {
  AddPropertyDTO,
  ChangePropertyDTO,
  GetPropertiesDTO,
  PropertyListRes,
} from '@dtos/property.dto';

export const getSpaceRoles = async (id: number, params?: GetRolesDTO): Promise<RoleListRes> => {
  return request(`/api/spaces/${id}/roles`, {
    params,
  });
};

export async function removeSpaceRole(id: number, roleId: number) {
  return request(`/api/spaces/${id}/roles/${roleId}`, {
    method: 'DELETE',
  });
}

export const changeSpaceRole = async (
  id: number,
  roleId: number,
  body: ChangeRoleDTO,
): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/roles/${roleId}`, {
    method: 'PUT',
    data: body,
  });
};

export const changeSpace = async (id: number, body: ChangeSpaceDTO): Promise<SpaceDetailRes> => {
  return request(`/api/spaces/${id}`, {
    method: 'PUT',
    data: body,
  });
};

export const addSpaceRole = async (id: number, body: AddRoleDTO): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/roles`, {
    method: 'POST',
    data: body,
  });
};

export const addSpaceProperty = async (id: number, body: AddPropertyDTO): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/properties`, {
    method: 'POST',
    data: body,
  });
};

export const getSpaceProperties = async (
  id: number,
  params?: GetPropertiesDTO,
): Promise<PropertyListRes> => {
  return request(`/api/spaces/${id}/properties`, {
    params,
  });
};

export const changeSpaceProperty = async (
  id: number,
  propertyId: number,
  body: ChangePropertyDTO,
): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/properties/${propertyId}`, {
    method: 'PUT',
    data: body,
  });
};

export async function removeSpaceProperty(id: number, propertyId: number) {
  return request(`/api/spaces/${id}/properties/${propertyId}`, {
    method: 'DELETE',
  });
}
