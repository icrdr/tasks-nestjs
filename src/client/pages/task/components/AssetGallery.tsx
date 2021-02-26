import React, { useRef, useState } from 'react';
import { Link, useModel, useParams, useRequest } from 'umi';
import {
  Card,
  Space,
  Upload,
  Button,
  message,
  Dropdown,
  Menu,
  Row,
  Col,
  Progress,
  Table,
} from 'antd';
import FileCard from './FileCard';
import { PictureOutlined } from '@ant-design/icons';
import { sleep } from '@utils/utils';
import moment from 'moment';
import { getOssClient } from '../../layout/layout.service';
import {
  addSpaceAsset,
  addTaskAsset,
  removeSpaceAsset,
  removeTaskAsset,
  getSpaceAssets,
  getTaskAssets,
} from '../task.service';
import { AssetListRes, AssetRes, GetAssetsDTO } from '@dtos/task.dto';
import FsLightbox from '@components/fslightbox';
import ProList from '@ant-design/pro-list';
import { ActionType } from '@ant-design/pro-table';

const AssetGallery: React.FC<{}> = () => {
  const currentTaskId = (useParams() as any).id;
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;

  const [assetList, setAssetList] = useState<AssetRes[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);
  const beforeUpload = (file, fileList) => {
    return true;
  };

  const [uploadProgress, setUploadProgress] = useState(0);

  const removeAsset = async (assetId: number): Promise<AssetListRes> => {
    if (currentTaskId) {
      return removeTaskAsset(currentTaskId, assetId);
    } else {
      return removeSpaceAsset(currentSpace.id, assetId);
    }
  };

  const removeAssetReq = useRequest(removeAsset, {
    manual: true,
    onSuccess: (res) => {
      actionRef.current.reload();
      setLightBoxUpdate(lightBoxUpdate + 1);
    },
  });

  const handleUpload = async (options) => {
    const maxTimes = 5;
    setUploading(true);
    setUploadProgress(0);
    window.onbeforeunload = () => true;
    const objectName = moment().format('YYYYMMDDhhmmss');
    const oss = await getOssClient();
    const name = options.file.name.split('.').slice(-999, -1).join('.');
    const format = options.file.name.split('.').slice(-1)[0];
    const type = options.file.type;
    const size = options.file.size;

    if (!oss) {
      message.error('no oss');
      return false;
    }
    console.log(options.file);
    let checkpoint;
    let attemptCount = 0;
    // return false;
    while (true) {
      try {
        await oss.multipartUpload(objectName, options.file, {
          checkpoint,
          progress: (ptg, cpt) => {
            setUploadProgress(ptg * 100 - 10);
            checkpoint = cpt;
          },
        });
        break;
      } catch (err) {
        console.log(err);
        if (++attemptCount > maxTimes) {
          message.error('bad network');
          setUploading(false);
          window.onbeforeunload = undefined;
          return false;
        } else {
          console.log(attemptCount);
          message.error('retry in 5 seconds');
          await sleep(5000);
        }
      }
    }

    try {
      if (currentTaskId) {
        await addTaskAsset(currentTaskId, {
          name,
          format,
          type,
          size,
          source: 'oss:' + objectName,
        });
      } else {
        await addSpaceAsset(currentSpace.id, {
          name,
          format,
          type,
          size,
          source: 'oss:' + objectName,
        });
      }

      console.log('ok');
      actionRef.current.reload();
      setLightBoxUpdate(lightBoxUpdate + 1);
      setUploadProgress(100);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
      window.onbeforeunload = undefined;
    }
  };

  const handleDownload = async (asset: AssetRes) => {
    const oss = await getOssClient();
    const _source = asset.source.split(':');
    const filename = asset.format ? `${asset.name}.${asset.format}` : asset.name;
    const source =
      _source[0] === 'oss'
        ? oss.signatureUrl(_source[1], {
            expires: 3600,
            response: {
              'content-disposition': `attachment; filename=${filename}`,
            },
          })
        : _source[1];
    window.open(source);
  };

  const handleRename = (asset: AssetRes) => {
    console.log('Rename');
  };

  const handleDelete = (asset: AssetRes) => {
    removeAssetReq.run(asset.id);
  };

  const menu = (asset: AssetRes) => {
    return (
      <Menu>
        <Menu.Item key="1" onClick={() => handleDownload(asset)}>
          下载
        </Menu.Item>
        <Menu.Item key="2" onClick={() => handleRename(asset)}>
          重命名
        </Menu.Item>
        <Menu.Item key="3" onClick={() => handleDelete(asset)}>
          删除
        </Menu.Item>
      </Menu>
    );
  };

  const actionRef = useRef<ActionType>();
  return (
    <>
      <ProList<AssetRes>
        headerTitle={
          isUploading ? (
            <Progress
              percent={uploadProgress}
              style={{ width: '200px' }}
              format={(percent) => percent.toFixed(1) + '%'}
            />
          ) : (
            <div></div>
          )
        }
        renderItem={(asset: AssetRes, index: number) => (
          <div style={{ padding: '0px 10px 20px 10px' }}>
            <Dropdown overlay={() => menu(asset)} key={index}>
              <FileCard
                name={asset.name}
                format={asset.format}
                preview={asset['_preview']}
                onTapPreview={() => {
                  const i = assetList.map((asset) => asset.id).indexOf(asset.id);
                  setLightBoxSlide(i);
                  setLightBoxToggle(!lightBoxToggle);
                }}
              />
            </Dropdown>
          </div>
        )}
        rowKey="id"
        // columns={columns}
        actionRef={actionRef}
        pagination={{
          defaultPageSize: 20,
        }}
        grid={{ column: 4 }}
        request={async (_params, sorter, filter) => {
          const res = currentTaskId
            ? await getTaskAssets(currentTaskId, _params)
            : await getSpaceAssets(currentSpace.id, { ..._params, isRoot: true });

          console.log(res);
          const oss = await getOssClient();
          const assets = res.list.map((asset) => {
            if (asset.preview) {
              const _preview = asset.preview.split(':');

              asset['_source'] =
                _preview[0] === 'oss'
                  ? oss.signatureUrl(_preview[1], { expires: 3600 })
                  : _preview[1];

              asset['_preview'] =
                _preview[0] === 'oss'
                  ? oss.signatureUrl(_preview[1], {
                      expires: 3600,
                      process: 'image/resize,w_500,h_150',
                    })
                  : _preview[1];
            } else {
              asset['_source'] = (
                <div style={{ background: 'white', width: '200px', height: '200px' }}>
                  <h3 style={{ lineHeight: '200px', textAlign: 'center' }}>no preview</h3>
                </div>
              );
            }

            const _source = asset.source.split(':');
            asset['__source'] =
              _source[0] === 'oss' ? oss.signatureUrl(_source[1], { expires: 3600 }) : _source[1];

            if (asset.type?.split('/')[0] === 'image' && asset.preview) {
              asset['_type'] = 'image';
            } else if (asset.type?.split('/')[0] === 'video') {
              asset['_type'] = 'video';
            } else {
              asset['_type'] = 'null';
            }

            return asset;
          });
          setAssetList(assets);
          setLightBoxUpdate(lightBoxUpdate + 1);
          return {
            data: assets,
            success: true,
            total: res.total,
          };
        }}
        options={{
          fullScreen: true,
        }}
        rowSelection={{
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
        }}
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space size="middle">
            <span>
              已选 {selectedRowKeys.length} 项
              <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
                取消选择
              </a>
            </span>
          </Space>
        )}
        tableAlertOptionRender={() => {
          return (
            <Space size="middle">
              <a>批量删除</a>
              <a>导出数据</a>
            </Space>
          );
        }}
        toolBarRender={() => [
          <Upload
            disabled={isUploading}
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={handleUpload}
          >
            <Button disabled={isUploading} icon={<PictureOutlined />}>
              上传文件
            </Button>
          </Upload>,
        ]}
      />
      <FsLightbox
        style={{ zIndex: 99999 }}
        toggler={lightBoxToggle}
        sourceIndex={lightBoxSlide}
        key={lightBoxUpdate}
        // disableThumbs={true}
        sources={assetList.map((asset) => asset['_source'])}
        types={assetList.map((asset) => asset['_type'])}
      />
    </>
  );
};
export default AssetGallery;
