import { request } from 'umi';
import { AssetRes, ChangeAssetDTO } from '@dtos/asset.dto';

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
