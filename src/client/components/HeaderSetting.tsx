import React from 'react';
import { PropertyRes } from '@dtos/property.dto';
import { Button, Dropdown, Menu, Space, Switch } from 'antd';
import { RoleRes } from '../../dtos/role.dto';
import { EyeOutlined, SettingOutlined } from '@ant-design/icons';
import { type } from 'os';

const HeaderSetting: React.FC<{
  headers: any[];
  roles?: RoleRes[];
  properties?: PropertyRes[];
  onChange?: (index: number, v: any) => void;
  onReset?: () => void;
  labelRender?: (type: string) => string;
}> = ({
  headers,
  roles = [],
  properties = [],
  onChange = () => {},
  onReset = () => {},
  labelRender = (type) => type,
}) => {
  const menu = (
    <Menu>
      {headers?.map((header, index) => {
        const type = header.title.split(':')[0];
        let label = '';
        switch (type) {
          case 'role':
            const roleId = parseInt(header.title.split(':')[1]);
            label = roles.filter((r) => r.id === roleId)[0].name;
            break;
          case 'prop':
            const propId = parseInt(header.title.split(':')[1]);
            label = properties.filter((p) => p.id === propId)[0].name;
            break;
          default:
            label = labelRender(type);
        }
        return (
          <Menu.Item key={index}>
            <Space>
              <Switch
                disabled={type === 'name'}
                size="small"
                checked={!header.hidden}
                onChange={(v) => onChange(index, v)}
              />
              <span>{label}</span>
            </Space>
          </Menu.Item>
        );
      })}
      <Menu.Item key={'reset'} onClick={onReset}>
        重置
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu}>
      <Button icon={<EyeOutlined />} shape='circle' />
    </Dropdown>
  );
};

export default HeaderSetting;
