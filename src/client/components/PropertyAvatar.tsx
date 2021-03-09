import {
  Select,
  Space,
  Popover,
  Button,
  Spin,
  Avatar,
  Dropdown,
  Menu,
  Tooltip,
} from "antd";
import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { UserRes } from "@dtos/user.dto";

const PropertyAvatar: React.FC<{
  users?: UserRes[];
  editable?: boolean;
  options?: { label: string; value: string }[];
  searchLoading?: boolean;
  lockLastItem?: boolean;
  onAdd?: (v) => void;
  onRemove?: (userId: number) => void;
  onSearch?: (v) => void;
}> = ({
  users=[],
  editable = false,
  options = [],
  searchLoading = false,
  lockLastItem = false,
  onAdd = () => {},
  onRemove = () => {},
  onSearch = () => {},
}) => {
  const menu = (userId: number) => (
    <Menu>
      <Menu.Item key="delete" onClick={() => onRemove(userId)}>
        删除
      </Menu.Item>
    </Menu>
  );
  return (
    <Space size={"small"} align="start">
      <Avatar.Group>
        {users?.map((user, i: number) => (
          <Dropdown
            disabled={(lockLastItem && users.length <= 1) || !editable}
            overlay={menu(user.id)}
            key={i}
            trigger={["contextMenu"]}
          >
            <Tooltip title={user.username}>
              <Avatar>{user.username}</Avatar>
            </Tooltip>
          </Dropdown>
        ))}
      </Avatar.Group>
      {editable && (
        <Popover
          placement="right"
          content={
            <Select
              style={{ width: 100 }}
              onChange={(v) => onAdd(v)}
              onSearch={(v) => onSearch(v)}
              options={options}
              showSearch
              showArrow={false}
              filterOption={false}
              notFoundContent={searchLoading ? <Spin size="small" /> : null}
            />
          }
        >
          <Button icon={<PlusOutlined />} type="primary" shape="circle" />
        </Popover>
      )}
    </Space>
  );
};

export default PropertyAvatar;
