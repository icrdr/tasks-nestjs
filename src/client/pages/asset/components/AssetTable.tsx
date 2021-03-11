import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { useModel, useRequest } from 'umi';
import { TaskMoreDetailRes } from '@dtos/task.dto';
import VTable from '@components/VTable';
import PropertyItem from '@components/PropertyItem';
import { RoleRes } from '@dtos/role.dto';
import { PropertyRes } from '@dtos/property.dto';
import {
  changeTask,
  getSpaceAssets,
  getTaskAssets,
  removeSpaceAsset,
  removeTask,
  removeTaskAsset,
} from '../../task/task.service';
import { AssetRes, ChangeAssetDTO, GetAssetsDTO } from '@dtos/asset.dto';
import PropertyString from '@components/PropertyString';
import { changeSpaceAsset, changeTaskAsset } from '../asset.service';
import { Button, Dropdown, Menu, Popconfirm } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';

const AssetTable: React.FC<{
  task?: TaskMoreDetailRes;
  headers?: any[];
  update?: boolean;
}> = ({ task, headers = [], update = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [thisUpdate, setThisUpdate] = useState(false);
  const [childUpdate, setChildUpdate] = useState(false);
  const vTableRef = useRef(null);
  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEdit = isFull || (task ? task.userAccess === 'edit' : currentSpace.userAccess === 'edit');

  const changeAsset = (id: number, body: ChangeAssetDTO, rowIndex) => {
    return task ? changeTaskAsset(task.id, id, body) : changeSpaceAsset(currentSpace.id, id, body);
  };

  const changeAssetReq = useRequest(changeAsset, {
    manual: true,
    onSuccess: (res, params) => {
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const removeAsset = async (assetId: number) => {
    return task ? removeTaskAsset(task.id, assetId) : removeSpaceAsset(currentSpace.id, assetId);
  };

  const removeAssetReq = useRequest(removeAsset, {
    manual: true,
    onSuccess: (res) => {
      setThisUpdate(!thisUpdate);
    },
  });

  const headersToColumns = (headers: any[], roles: RoleRes[], properties: PropertyRes[]) => {
    const _column = headers
      .filter((header) => !header.hidden)
      .map((header) => {
        const type = header.title.split(':')[0];
        switch (type) {
          case 'name':
            return {
              title: '文件名',
              width: header.width,
              itemRender: (asset: AssetRes, columnIndex, rowIndex) => (
                <PropertyString
                  value={asset.name}
                  editable={isEdit}
                  onChange={(v) => changeAssetReq.run(asset.id, { name: v }, rowIndex)}
                />
              ),
            };
          case 'format':
            return {
              title: '格式名',
              width: header.width,
              itemRender: (asset: AssetRes, columnIndex, rowIndex) => (
                <PropertyString value={asset.format} />
              ),
            };
          case 'createAt':
            return {
              title: '上传日期',
              width: header.width,
              itemRender: (asset: AssetRes, columnIndex, rowIndex) => (
                <div>{asset.createAt ? moment(asset.createAt).format('YYYY/MM/DD') : '/'}</div>
              ),
            };
          case 'prop':
            const property = properties.filter(
              (p) => p.id === parseInt(header.title.split(':')[1]),
            )[0];
            return property
              ? {
                  title: property.name,
                  width: header.width,
                  itemRender: (asset: AssetRes, columnIndex, rowIndex) => {
                    const value = asset.properties
                      ? asset.properties['prop' + property.id]?.toString()
                      : undefined;
                    return (
                      <PropertyItem
                        property={property}
                        value={value}
                        editable={isEdit}
                        onChange={(v) => {
                          const properties = asset.properties || {};
                          properties['prop' + property.id] = v;
                          changeAssetReq.run(asset.id, { properties }, rowIndex);
                        }}
                      />
                    );
                  },
                }
              : undefined;
        }
      })
      .filter((c) => c !== undefined);

    const actionMenu = (asset: AssetRes) => (
      <Menu>
        <Menu.Item key="delete">
          <Popconfirm
            title="你确定要移除该文件么？"
            onConfirm={() => removeAssetReq.run(asset.id)}
            okText="确认"
            cancelText="取消"
          >
            <a href="#">删除</a>
          </Popconfirm>
        </Menu.Item>
      </Menu>
    );

    _column.push({
      title: '操作',
      width: 50,
      itemRender: (member: AssetRes) => (
        <Dropdown overlay={actionMenu(member)}>
          <Button icon={<EllipsisOutlined />}></Button>
        </Dropdown>
      ),
    });
    return _column;
  };

  const [columns, setColumns] = useState(
    headersToColumns(headers, currentSpace.roles, currentSpace.assetProperties),
  );

  useEffect(() => {
    setColumns(headersToColumns(headers, currentSpace.roles, currentSpace.assetProperties));
    setChildUpdate(!childUpdate);
  }, [update]);

  const getAssets = async (body: GetAssetsDTO) => {
    const params = {};
    if (headers) {
      for (const header of headers) {
        if (header.filter) params[header.title] = header.filter;
      }
    }
    return task
      ? await getTaskAssets(task.id, { ...params, ...body })
      : await getSpaceAssets(currentSpace.id, {
          ...params,
          ...body,
          isRoot: true,
        });
  };

  return <VTable ref={vTableRef} request={getAssets} columns={columns} update={childUpdate} />;
}; // Usage

export default AssetTable;
