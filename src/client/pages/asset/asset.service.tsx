import { request } from 'umi';
import { AssetRes, ChangeAssetDTO } from '@dtos/asset.dto';

export const changeSpaceAsset = async (
  id: number,
  assetId: number,
  body: ChangeAssetDTO,
): Promise<AssetRes> => {
  return request(`/api/spaces/${id}/assets/${assetId}`, {
    method: 'PUT',
    data: body,
  });
};

export const changeTaskAsset = async (
  id: number,
  assetId: number,
  body: ChangeAssetDTO,
): Promise<AssetRes> => {
  return request(`/api/tasks/${id}/assets/${assetId}`, {
    method: 'PUT',
    data: body,
  });
};
