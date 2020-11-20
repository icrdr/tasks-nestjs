import { Tooltip, Space, Avatar, Dropdown, Menu, Spin, Input } from 'antd';
import { QuestionCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import React from 'react';
import { history, SelectLang, useModel, useRequest } from 'umi';

import { getCurrentUser, logout } from '@/service';
import Access from './Access';
import { currentUser } from '../interface';
import Cookies from 'js-cookie';

const menu = (
  <Menu>
    <Menu.Item
      key="logout"
      onClick={() => {
        Cookies.remove('token');
        history.push('/login');
      }}
    >
      <LogoutOutlined />
      退出登录
    </Menu.Item>
  </Menu>
);
interface HeaderAvatarProps {
  currentUser?: currentUser;
}
const HeaderAvatar: React.FC<HeaderAvatarProps> = (props) => {
  return (
    <Dropdown overlay={menu}>
      <Space>
        <Avatar size="small" src={props.currentUser?.avatar} alt="avatar" />
        <span>{props.currentUser?.name}</span>
      </Space>
    </Dropdown>
  );
};

const RightContent: React.FC<{}> = () => {
  const handleSearch = () => {};
  const { initialState, setInitialState } = useModel('@@initialState');
  const { data } = useRequest(getCurrentUser, {
    onSuccess: (res) => {
      if (initialState) initialState.currentUser = res;
      console.log(initialState);
      setInitialState(initialState);
    },
    formatResult: (res) => res,
  });
  return (
    <Access>
      <Space size="middle">
        <Input.Search
          size="small"
          className="v-a:m"
          placeholder="input search text"
          onSearch={handleSearch}
          style={{ width: 200 }}
        />
        <Tooltip title="使用文档">
          <span onClick={() => history.push('https://pro.ant.design/docs/getting-started')}>
            <QuestionCircleOutlined />
          </span>
        </Tooltip>
        <HeaderAvatar currentUser={data} />
        <SelectLang />
      </Space>
    </Access>
  );
};
export default RightContent;
