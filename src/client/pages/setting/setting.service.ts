import { request } from 'umi';
import { ChangeRoleDTO, GetRolesDTO, RoleListRes, RoleRes } from '@dtos/space.dto';

export const getSpaceRoles = async (id: number, params?: GetRolesDTO): Promise<RoleListRes> => {
  return request(`/api/spaces/${id}/roles`, {
    params,
  });
};

export const changeRole = async (
  id: number,
  roleId: number,
  body: ChangeRoleDTO,
): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/roles/${roleId}`, {
    method: 'PUT',
    data: body,
  });
};
