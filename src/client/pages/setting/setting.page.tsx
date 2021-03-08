import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Card, Descriptions, Form, Input, Modal, Select, Space, Typography } from 'antd';
import RoleTable from './components/RoleTable';
import { addSpaceProperty, addSpaceRole, changeSpace } from './setting.service';
import { getSpace } from '../layout/layout.service';
import PropertyTable from './components/PropertyTable';
import { PropertyType } from '../../../server/common/common.entity';

const { Text, Title } = Typography;
const Setting: React.FC<{}> = (props) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [addRoleForm] = Form.useForm();
  const [addTaskPropForm] = Form.useForm();
  const [addMemberPropForm] = Form.useForm();
  const [addAssetPropForm] = Form.useForm();
  const [isAddRoleVisible, setAddRoleVisible] = useState(false);
  const [isAddTaskPropVisible, setAddTaskPropVisible] = useState(false);
  const [isAddMemberPropVisible, setAddMemberPropVisible] = useState(false);
  const [isAddAssetPropVisible, setAddAssetPropVisible] = useState(false);
  const [taskPropUpdate, setTaskPropUpdate] = useState(false);
  const [memberPropUpdate, setMemberPropUpdate] = useState(false);
  const [assetPropUpdate, setAssetPropUpdate] = useState(false);
  const [roleUpdate, setRoleUpdate] = useState(false);

  const addSpaceRoleReq = useRequest(addSpaceRole, {
    manual: true,
    onSuccess: async () => {
      setRoleUpdate(!roleUpdate);
      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const addSpacePropertyReq = useRequest(addSpaceProperty, {
    manual: true,
    onSuccess: async (_, params) => {
      switch (params[1].type) {
        case 'task':
          setTaskPropUpdate(!taskPropUpdate);
          break;
        case 'member':
          setMemberPropUpdate(!memberPropUpdate);
          break;
        case 'asset':
          setAssetPropUpdate(!assetPropUpdate);
          break;
        default:
          break;
      }

      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const changeSpaceReq = useRequest(changeSpace, {
    manual: true,
    onSuccess: (res) => {
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <Card>
          <Descriptions labelStyle={{ lineHeight: '32px' }} column={2}>
            <Descriptions.Item key="name" label="空间名">
              <Input
                style={{ width: '200px' }}
                defaultValue={currentSpace?.name}
                onPressEnter={(e) => {
                  e.preventDefault();
                  changeSpaceReq.run(currentSpace.id, {
                    name: e.currentTarget.value,
                  });
                }}
              />
            </Descriptions.Item>
            <Descriptions.Item key="access" label="空间默认权限">
              <Select
                value={currentSpace.access}
                onChange={(v) => changeSpaceReq.run(currentSpace.id, { access: v })}
              >
                <Select.Option value="full">完全</Select.Option>
                <Select.Option value="edit">编辑</Select.Option>
                <Select.Option value="view">浏览</Select.Option>
              </Select>
            </Descriptions.Item>
          </Descriptions>
        </Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setAddTaskPropVisible(true)}
          >
            新任务属性
          </Button>
          <PropertyTable type={'task' as PropertyType} list={currentSpace.taskProperties} />
        </Space>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setAddMemberPropVisible(true)}
          >
            新成员属性
          </Button>
          <PropertyTable type={'member' as PropertyType} list={currentSpace.memberProperties} />
        </Space>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setAddAssetPropVisible(true)}
          >
            新资源属性
          </Button>
          <PropertyTable type={'asset' as PropertyType} list={currentSpace.assetProperties} />
        </Space>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setAddRoleVisible(true)}
          >
            新角色
          </Button>
          <RoleTable list={currentSpace.roles} />
        </Space>
      </Space>
      <Modal
        closable={false}
        visible={isAddRoleVisible}
        onOk={() => {
          addRoleForm.submit();
          setAddRoleVisible(false);
        }}
        onCancel={() => setAddRoleVisible(false)}
      >
        <Form
          name="name"
          form={addRoleForm}
          onFinish={(v: any) => {
            addSpaceRoleReq.run(currentSpace.id, { name: v.name });
            addRoleForm.resetFields();
          }}
        >
          <Form.Item
            label="角色名"
            name="name"
            rules={[{ required: true, message: '角色名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        closable={false}
        visible={isAddTaskPropVisible}
        onOk={() => {
          addTaskPropForm.submit();
          setAddTaskPropVisible(false);
        }}
        onCancel={() => setAddTaskPropVisible(false)}
      >
        <Form
          name="name"
          form={addTaskPropForm}
          onFinish={(v: any) => {
            addSpacePropertyReq.run(currentSpace.id, {
              name: v.name,
              type: 'task' as PropertyType,
            });
            addTaskPropForm.resetFields();
          }}
        >
          <Form.Item
            label="属性名"
            name="name"
            rules={[{ required: true, message: '属性名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        closable={false}
        visible={isAddMemberPropVisible}
        onOk={() => {
          addMemberPropForm.submit();
          setAddMemberPropVisible(false);
        }}
        onCancel={() => setAddMemberPropVisible(false)}
      >
        <Form
          name="name"
          form={addMemberPropForm}
          onFinish={(v: any) => {
            addSpacePropertyReq.run(currentSpace.id, {
              name: v.name,
              type: 'member' as PropertyType,
            });
            addMemberPropForm.resetFields();
          }}
        >
          <Form.Item
            label="属性名"
            name="name"
            rules={[{ required: true, message: '属性名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        closable={false}
        visible={isAddAssetPropVisible}
        onOk={() => {
          addAssetPropForm.submit();
          setAddAssetPropVisible(false);
        }}
        onCancel={() => setAddAssetPropVisible(false)}
      >
        <Form
          name="name"
          form={addAssetPropForm}
          onFinish={(v: any) => {
            addSpacePropertyReq.run(currentSpace.id, {
              name: v.name,
              type: 'asset' as PropertyType,
            });
            addAssetPropForm.resetFields();
          }}
        >
          <Form.Item
            label="属性名"
            name="name"
            rules={[{ required: true, message: '属性名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Setting;
