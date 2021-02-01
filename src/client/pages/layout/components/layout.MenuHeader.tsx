import { Tooltip, Space, Avatar, Dropdown, Menu, Spin, Input, Button } from 'antd';
import { QuestionCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { history, SelectLang, useModel, useRequest } from 'umi';

import Access from '@components/Access';
import Cookies from 'js-cookie';
import { CurrentUserRes } from '@dtos/user.dto';

const MenuHeader: React.FC<{}> = () => {
  return <Space size="middle">menu</Space>;
};
export default MenuHeader;
