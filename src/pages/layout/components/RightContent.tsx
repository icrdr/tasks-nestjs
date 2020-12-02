import { Tooltip, Space, Avatar, Dropdown, Menu, Spin, Input, Button } from 'antd';
import { QuestionCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { history, SelectLang, useModel, useRequest } from 'umi';

import Access from '@/components/Access';
import Cookies from 'js-cookie';
import { me } from '@/dtos/user.dto';

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
  me?: me;
}
const HeaderAvatar: React.FC<HeaderAvatarProps> = ({ me }) => {
  return (
    <Dropdown overlay={menu}>
      <Space>
        <Avatar size="small" style={{ backgroundColor: '#87d068' }} src={me?.username}>
          {me?.username[0].toUpperCase()}
        </Avatar>
      </Space>
    </Dropdown>
  );
};

const RightContent: React.FC<{}> = () => {
  const handleSearch = () => {};
  const { initialState } = useModel('@@initialState');
  if (!initialState.me) {
    history.push('/login');
  }

  return (
    <Access>
      <Space size="middle">
        <HeaderAvatar me={initialState.me} />
        <SelectLang />
      </Space>
    </Access>
  );
};
export default RightContent;
