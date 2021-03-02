import { Menu, Dropdown, Button, Popover, Spin, List, Divider, Space } from 'antd';
import { DownOutlined, ExpandOutlined, SettingOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import { history, SelectLang, useModel, useRequest } from 'umi';
import { getSpaces } from '../layout.service';
import { SpaceDetailRes } from '@dtos/space.dto';
import Cookies from 'js-cookie';
import CreateSpaceForm from './layout.AddSpaceForm';
import { SiderMenuProps } from '@ant-design/pro-layout/lib/components/SiderMenu/SiderMenu';

const SpaceMenu: React.FC<{ props: SiderMenuProps }> = (props) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  if (!currentSpace) {
    history.push('/login');
  }
  
  const getSpacesReq = useRequest(getSpaces, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
    },
  });

  const content = (
    <div>
      {getSpacesReq.loading ? (
        <Spin />
      ) : (
        getSpacesReq.data && (
          <List
            dataSource={getSpacesReq.data.list}
            split={true}
            footer={<CreateSpaceForm />}
            renderItem={(space) => (
              <List.Item>
                <Button type="link" onClick={() => handleSetSpace(space)}>
                  {space.name}
                </Button>
              </List.Item>
            )}
          />
        )
      )}
    </div>
  );

  const handleSetSpace = (currentSpace: SpaceDetailRes) => {
    setInitialState({ ...initialState, currentSpace });
    Cookies.set('space', currentSpace.id.toString());
    console.log(currentSpace);
    history.push('/');
  };

  const handlePopoverOpen = (visible: boolean) => {
    if (visible) getSpacesReq.run();
  };

  return (
    <Popover
      content={content}
      trigger={'click'}
      onVisibleChange={handlePopoverOpen}
      overlayStyle={{ padding: 0 }}
    >
      {props.props.collapsed ? (
        <SettingOutlined />
      ) : (
        <Button icon={<SettingOutlined />}>{currentSpace?.name}</Button>
      )}
    </Popover>
  );
};
export default SpaceMenu;
