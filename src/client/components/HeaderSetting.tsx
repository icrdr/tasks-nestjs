import React from "react";
import { PropertyRes } from "@dtos/property.dto";
import { Button, Dropdown, Menu, Space, Switch } from "antd";
import { RoleRes } from "../../dtos/role.dto";
import { SettingOutlined } from "@ant-design/icons";

const HeaderSetting: React.FC<{
  headers: any[];
  roles?: RoleRes[];
  properties?: PropertyRes[];
  onChange?: (index: number, v: any) => void;
  onReset?: () => void;
}> = ({
  headers,
  roles = [],
  properties = [],
  onChange = () => {},
  onReset = () => {},
}) => {
  const menu = (
    <Menu>
      {headers?.map((header, index) => {
        const type = header.title.split(":")[0];
        let label = "";
        switch (type) {
          case "username":
            label = "用户名";
          case "name":
            label = "名称";
            break;
          case "format":
            label = "格式名";
            break;
          case "priority":
            label = "优先级";
            break;
          case "state":
            label = "状态";
            break;
          case "createAt":
            label = "创建日期";
            break;
          case "dueAt":
            label = "截止日";
            break;
          case "role":
            const roleId = parseInt(header.title.split(":")[1]);
            label = roles.filter((r) => r.id === roleId)[0].name;
            break;
          case "prop":
            const propId = parseInt(header.title.split(":")[1]);
            label = properties.filter((p) => p.id === propId)[0].name;
            break;
        }
        return (
          <Menu.Item key={index}>
            <Space>
              <Switch
                disabled={type === "name"}
                size="small"
                defaultChecked={!header.hidden}
                onChange={(v) => onChange(index, v)}
              />
              <span>{label}</span>
            </Space>
          </Menu.Item>
        );
      })}
      <Menu.Item key={"reset"} onClick={onReset}>
        重置
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu}>
      <Button icon={<SettingOutlined />} />
    </Dropdown>
  );
};

export default HeaderSetting;
