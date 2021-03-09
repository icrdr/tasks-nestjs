import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Dropdown, Input, Menu, Popconfirm, Select, Table, Tag, Typography } from 'antd';
import { changeSpaceProperty, getSpaceProperties, removeSpaceProperty } from '../setting.service';
import { EllipsisOutlined } from '@ant-design/icons';
import { getSpace } from '../../layout/layout.service';
import { PropertyRes } from '@dtos/property.dto';
import { PropertyForm, PropertyType } from '@server/common/common.entity';

const { Text } = Typography;

const PropertyTable: React.FC<{ list: PropertyRes[]; type: PropertyType; update?: boolean }> = ({
  list,
  type,
  update = false,
}) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  // const [propertyList, setPropertyList] = useState<PropertyRes[]>([]);
  const [dataUpdate, setDataUpdate] = useState(false);

  // const getSpacePropertiesReq = useRequest(() => getSpaceProperties(currentSpace.id, { type }), {
  //   refreshDeps: [update, dataUpdate],
  //   onSuccess: (res) => {
  //     setPropertyList(res.list);
  //   },
  // });

  const removeSpacePropertyReq = useRequest(removeSpaceProperty, {
    manual: true,
    onSuccess: async () => {
      // setDataUpdate(!dataUpdate);
      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const changeSpacePropertyReq = useRequest(changeSpaceProperty, {
    manual: true,
    onSuccess: async (_, params) => {
      // setDataUpdate(!dataUpdate);
      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const columns = [
    {
      title: '属性名',
      dataIndex: 'name',
      key: 'name',
      render: (_, property) => {
        return (
          <Text
            editable={{
              onChange: (v) => {
                if (v) changeSpacePropertyReq.run(currentSpace.id, property.id, { name: v });
              },
            }}
          >
            {property.name}
          </Text>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'form',
      key: 'form',
      render: (_, property: PropertyRes) => {
        return (
          <Select
            defaultValue={property.form}
            onChange={(v) =>
              changeSpacePropertyReq.run(currentSpace.id, property.id, { form: v as PropertyForm })
            }
          >
            <Select.Option value="string">文本</Select.Option>
            <Select.Option value="number">数字</Select.Option>
            <Select.Option value="radio">单选</Select.Option>
            <Select.Option value="select">多选</Select.Option>
          </Select>
        );
      },
    },
    {
      title: '选项',
      dataIndex: 'item',
      key: 'item',
      render: (_, property: PropertyRes) => {
        return (
          ['radio', 'select'].indexOf(property.form) >= 0 && (
            <Dropdown overlay={itemsMenu(property)}>
              <Input
                style={{ width: '200px' }}
                onPressEnter={(e) => {
                  const items = property.items || {};
                  items[e.currentTarget.value] = { color: 'blue' };
                  changeSpacePropertyReq.run(currentSpace.id, property.id, { items });
                }}
                allowClear
              />
            </Dropdown>
          )
        );
      },
    },
  ];

  const itemsMenu = (property: PropertyRes) => (
    <Menu>
      {property.items &&
        Object.entries(property.items).map((item: [string, { color: string }]) => {
          return (
            <Menu.Item key={item[0]}>
              <Tag
                closable
                color={item[1].color || 'blue'}
                onClose={() => {
                  const items = property.items || {};
                  delete items[item[0]];
                  changeSpacePropertyReq.run(currentSpace.id, property.id, { items });
                }}
              >
                {item[0]}
              </Tag>
            </Menu.Item>
          );
        })}
    </Menu>
  );

  const actionMenu = (property: PropertyRes) => (
    <Menu>
      <Menu.Item disabled={list.map((r) => r.id).indexOf(property.id) === 0} key="1">
        <Popconfirm
          title="你确定要删除该属性么？"
          onConfirm={() => removeSpacePropertyReq.run(currentSpace.id, property.id)}
          okText="确认"
          cancelText="取消"
        >
          <a href="#">删除</a>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  columns.push({
    dataIndex: 'action',
    title: '操作',
    key: 'action',
    render: (_, property: PropertyRes) => (
      <Dropdown overlay={actionMenu(property)}>
        <Button icon={<EllipsisOutlined />}></Button>
      </Dropdown>
    ),
  });

  return (
    <Table
      pagination={false}
      rowKey={(e) => e.id}
      columns={columns}
      loading={!list}
      dataSource={list}
    />
  );
};
export default PropertyTable;