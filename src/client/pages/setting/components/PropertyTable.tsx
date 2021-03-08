import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Dropdown, Menu, Popconfirm, Select, Table, Typography } from 'antd';
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
    onSuccess: async () => {
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
  ];

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
