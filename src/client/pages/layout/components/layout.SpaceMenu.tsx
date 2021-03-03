import {
  Menu,
  Dropdown,
  Button,
  Popover,
  Spin,
  Avatar,
  Divider,
  Space,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  AppstoreAddOutlined,
  DownOutlined,
  ExpandOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import React, { useState } from 'react';
import { useAccess, Access, useHistory, useLocation, useModel, useRequest } from 'umi';
import { addSpace, getSpace, getSpaces } from '../layout.service';
import { SpaceDetailRes } from '@dtos/space.dto';
import Cookies from 'js-cookie';
import { SiderMenuProps } from '@ant-design/pro-layout/lib/components/SiderMenu/SiderMenu';

const SpaceMenu: React.FC<{ props: SiderMenuProps }> = (props) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace, currentUser } = initialState;
  const history = useHistory();
  const location = useLocation();

  if (!currentUser) {
    if (location.pathname !== '/login') history.push('/login');
  }

  const [isModalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const [spaceList, setSpaceList] = useState([]);

  const getSpaceReq = useRequest(getSpace, {
    manual: true,
    onSuccess: (res) => {
      setInitialState({ ...initialState, currentSpace: res });
      localStorage.setItem('currentSpaceId', res.id.toString());
      console.log(res);
      if (location.pathname === '/task') {
        history.go(0);
      } else {
        history.push('/task');
      }
    },
  });

  const getSpacesReq = useRequest(getSpaces, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setSpaceList(res.list);
    },
  });

  const addSpaceReq = useRequest(addSpace, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setInitialState({ ...initialState, currentSpace: res });
      localStorage.setItem('currentSpaceId', res.id.toString());
      if (location.pathname === '/task') {
        history.go(0);
      } else {
        history.push('/task');
      }
    },
  });

  const userMenus = [
    <Menu.Item
      key="me"
      onClick={() => {
        history.push('/me');
      }}
      icon={<SettingOutlined />}
    >
      个人设置
    </Menu.Item>,
    <Menu.Item
      key="logout"
      onClick={() => {
        Cookies.remove('token');
        history.push('/login');
      }}
      icon={<LogoutOutlined />}
    >
      退出登录
    </Menu.Item>,
  ];

  const spaceMenus = [
    !getSpacesReq.loading ? (
      spaceList.map((space, index) => (
        <Menu.Item key={index}>
          <a style={{ textAlign: 'center' }} onClick={() => handleSetSpace(space.id)}>
            {space.name}
          </a>
        </Menu.Item>
      ))
    ) : (
      <Menu.Item key="s">
        <Spin />
      </Menu.Item>
    ),
    currentUser?.role === 'admin' && [
      <Menu.Divider key="d" />,
      <Menu.Item key="out" icon={<AppstoreAddOutlined />}>
        <a style={{ textAlign: 'center' }} onClick={() => setModalVisible(true)}>
          新空间
        </a>
      </Menu.Item>,
    ],
  ];

  const handleSetSpace = (spaceId: number) => {
    getSpaceReq.run(spaceId);
  };

  const handleDropdown = (visible: boolean) => {
    if (visible) getSpacesReq.run();
  };

  return (
    <>
      {props.props.collapsed ? (
        <Menu mode="inline">
          <Menu.SubMenu
            key="user"
            icon={
              <Avatar size="small" style={{ left: '-4px' }}>
                {currentUser?.username}
              </Avatar>
            }
          >
            {userMenus}
          </Menu.SubMenu>
          {currentSpace ? (
            <Menu.SubMenu
              key="space"
              icon={<HomeOutlined />}
              onTitleMouseEnter={(e) => handleDropdown(true)}
            >
              {spaceMenus}
            </Menu.SubMenu>
          ) : currentUser?.role === 'admin' ? (
            <Menu.Item icon={<AppstoreAddOutlined />} onClick={() => setModalVisible(true)}>
              新空间
            </Menu.Item>
          ) : (
            <Menu.Item icon={<HomeOutlined />} />
          )}
        </Menu>
      ) : (
        <Space align="center" direction={'vertical'} size={'middle'} style={{ width: '100%' }}>
          <Dropdown overlay={<Menu>{userMenus}</Menu>} placement="bottomCenter">
            <Space direction={'vertical'}>
              <Avatar size="large">{currentUser?.username}</Avatar>
              <div>{currentUser?.username}</div>
            </Space>
          </Dropdown>
          {currentSpace ? (
            <Dropdown
              overlay={<Menu>{spaceMenus}</Menu>}
              onVisibleChange={handleDropdown}
              placement="bottomCenter"
            >
              <Button icon={<HomeOutlined />}>{currentSpace?.name}</Button>
            </Dropdown>
          ) : currentUser?.role === 'admin' ? (
            <Button icon={<AppstoreAddOutlined />} onClick={() => setModalVisible(true)}>
              新空间
            </Button>
          ) : (
            <Button icon={<HomeOutlined />} />
          )}
        </Space>
      )}
      <Modal
        closable={false}
        visible={isModalVisible}
        onOk={() => {
          form.submit();
          setModalVisible(false);
        }}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          name="name"
          form={form}
          onFinish={(value: any) => {
            addSpaceReq.run(value);
            form.resetFields();
          }}
        >
          <Form.Item
            label="空间名"
            name="name"
            rules={[{ required: true, message: '空间名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default SpaceMenu;
