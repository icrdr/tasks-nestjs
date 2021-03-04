import { ChangeAssetDTO } from '@dtos/space.dto';
import { AssetRes } from '@dtos/task.dto';
import { request } from 'umi';

export const changeAsset = async (
  id: number,
  assetId: number,
  body: ChangeAssetDTO,
): Promise<AssetRes> => {
  return request(`/api/spaces/${id}/assets/${assetId}`, {
    method: 'PUT',
    data: body,
  });
};
