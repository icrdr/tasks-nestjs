import {
  Menu,
  Dropdown,
  Button,
  Popover,
  Spin,
  Avatar,
  Divider,
  Space,
} from "antd";
import {
  DownOutlined,
  ExpandOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import { history, SelectLang, useModel, useRequest } from "umi";
import { getSpaces } from "../layout.service";
import { SpaceDetailRes } from "@dtos/space.dto";
import Cookies from "js-cookie";
import CreateSpaceForm from "./layout.AddSpaceForm";
import { SiderMenuProps } from "@ant-design/pro-layout/lib/components/SiderMenu/SiderMenu";

const SpaceMenu: React.FC<{ props: SiderMenuProps }> = (props) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace, currentUser } = initialState;
  if (!currentUser) {
    history.push("/login");
  }
  if (!currentSpace) {
    history.push("/login");
  }
  const [spaceList, setSpaceList] = useState([]);
  const getSpacesReq = useRequest(getSpaces, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setSpaceList(res.list);
    },
  });

  const userMenus = [
    <Menu.Item
      key="logout"
      onClick={() => {
        Cookies.remove("token");
        history.push("/login");
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
          <a
            style={{ textAlign: "center" }}
            onClick={() => handleSetSpace(space)}
          >
            {space.name}
          </a>
        </Menu.Item>
      ))
    ) : (
      <Menu.Item key="s">
        <Spin />
      </Menu.Item>
    ),
    <Menu.Divider key="d" />,
    <Menu.Item key="out">
      <CreateSpaceForm />
    </Menu.Item>,
  ];

  const handleSetSpace = (currentSpace: SpaceDetailRes) => {
    setInitialState({ ...initialState, currentSpace });
    Cookies.set("space", currentSpace.id.toString());
    console.log(currentSpace);
    history.push("/");
  };

  const handleDropdown = (visible: boolean) => {
    if (visible) getSpacesReq.run();
  };

  return props.props.collapsed ? (
    <Menu mode="inline" inlineCollapsed>
      <Menu.SubMenu
        key="user"
        icon={
          <Avatar size="small" style={{ left: "-4px" }}>
            {currentUser.username}
          </Avatar>
        }
      >
        {userMenus}
      </Menu.SubMenu>
      <Menu.SubMenu
        key="space"
        icon={<HomeOutlined />}
        onTitleMouseEnter={(e) => handleDropdown(true)}
      >
        {spaceMenus}
      </Menu.SubMenu>
    </Menu>
  ) : (
    <Space
      align="center"
      direction={"vertical"}
      size={"middle"}
      style={{ width: "100%" }}
    >
      <Dropdown overlay={<Menu>{userMenus}</Menu>}>
        <Space direction={"vertical"}>
          <Avatar size="large">{currentUser.username}</Avatar>
          <div>{currentUser.username}</div>
        </Space>
      </Dropdown>
      <Dropdown
        overlay={<Menu>{spaceMenus}</Menu>}
        onVisibleChange={handleDropdown}
      >
        <Button icon={<HomeOutlined />}>{currentSpace?.name}</Button>
      </Dropdown>
    </Space>
  );
};
export default SpaceMenu;
