import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Form, Input, Modal, Select, Space, Spin } from 'antd';
import { addSpaceGroup, addSpaceMember } from './member.service';
import MemberTable from './components/MemberTable';
import { getUsers } from '../task/task.service';
import GroupList from './components/GroupList';
import { ViewOption } from '@server/common/common.entity';
import { getInitViewOption } from '@utils/utils';
import HeaderFilter from '../../components/HeaderFilter';
import HeaderSetting from '../../components/HeaderSetting';
import { UserAddOutlined, UsergroupAddOutlined, UserOutlined } from '@ant-design/icons';
import FilterString from '../../components/FilterString';

const defaultOption = {
  form: 'gallery',
  headers: [
    {
      title: 'username',
      width: 150,
      filter: undefined,
      hidden: false,
    },
  ],
};
const labelRender = (type) => {
  switch (type) {
    case 'username':
      return '用户名';
    default:
      return type;
  }
};

const filterRender = (type, filter, index, onChange) => {
  switch (type) {
    case 'username':
      return (
        <FilterString
          key={index}
          placeholder="用户名"
          onChange={(v) => onChange(index, v)}
          value={filter || ''}
        />
      );
  }
};

const Resource: React.FC<{}> = (props) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;

  const viewOptionKey = `spaceMemberViewOption`;

  const [addMemberForm] = Form.useForm();
  const [addGroupForm] = Form.useForm();
  const [isAddMemberVisible, setAddMemberVisible] = useState(false);
  const [isAddGroupVisible, setAddGroupVisible] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [groupUpdate, setGroupUpdate] = useState(false);
  const [memberUpdate, setMemberUpdate] = useState(false);

  const [viewOption, setViewOption] = useState<ViewOption>(
    getInitViewOption(
      JSON.parse(localStorage.getItem(viewOptionKey)),
      defaultOption,
      currentSpace.memberProperties,
    ),
  );

  const getUsersReq = useRequest(getUsers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      const userOptions = res.list.map((user) => {
        return {
          label: user.username,
          value: user.id,
        };
      });
      setUserOptions(userOptions);
    },
  });

  const addSpaceMemberReq = useRequest(addSpaceMember, {
    manual: true,
    onSuccess: (res) => {
      setMemberUpdate(!memberUpdate);
    },
  });

  const addSpaceGroupReq = useRequest(addSpaceGroup, {
    manual: true,
    onSuccess: (res) => {
      setGroupUpdate(!groupUpdate);
    },
  });

  const saveOption = (option) => {
    setViewOption(option);
    localStorage.setItem(viewOptionKey, JSON.stringify(option));
    setMemberUpdate(!memberUpdate);
  };

  const resetOption = () => {
    localStorage.removeItem(viewOptionKey);
    setViewOption(getInitViewOption(undefined, defaultOption, currentSpace.memberProperties));
    setMemberUpdate(!memberUpdate);
  };

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <Button
          type="primary"
          onClick={() => setAddGroupVisible(true)}
          icon={<UsergroupAddOutlined />}
        >
          新小组
        </Button>
        <GroupList update={groupUpdate} />
        <div className="left-right-layout-container">
          <Space>
            <Button
              type="primary"
              onClick={() => setAddMemberVisible(true)}
              icon={<UserAddOutlined />}
            >
              新成员
            </Button>
            <HeaderSetting
              labelRender={labelRender}
              headers={viewOption?.headers}
              properties={currentSpace.memberProperties}
              onChange={(index, v) => {
                const headers = viewOption.headers;
                headers[index].hidden = !v;
                saveOption({ ...viewOption, headers });
              }}
              onReset={resetOption}
            />
          </Space>
          <HeaderFilter
            filterRender={filterRender}
            headers={viewOption?.headers}
            properties={currentSpace.memberProperties}
            onChange={(index, v) => {
              const headers = viewOption.headers;
              headers[index].filter = v;
              saveOption({ ...viewOption, headers });
            }}
          />
        </div>
        <div style={{ height: 'calc(100vh - 100px)' }}>
          {viewOption && <MemberTable headers={viewOption.headers} update={memberUpdate} />}
        </div>
      </Space>
      <Modal
        closable={false}
        visible={isAddMemberVisible}
        onOk={() => {
          addMemberForm.submit();
          setAddMemberVisible(false);
        }}
        onCancel={() => setAddMemberVisible(false)}
      >
        <Form
          form={addMemberForm}
          onFinish={(v: any) => {
            addSpaceMemberReq.run(currentSpace.id, v.username);
            addMemberForm.resetFields();
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '用户名是必须的' }]}
          >
            <Select
              style={{ width: 100 }}
              onSearch={(v) => getUsersReq.run({ username: v })}
              options={userOptions}
              showSearch
              showArrow={false}
              filterOption={false}
              notFoundContent={getUsersReq.loading ? <Spin size="small" /> : null}
            />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        closable={false}
        visible={isAddGroupVisible}
        onOk={() => {
          addGroupForm.submit();
          setAddGroupVisible(false);
        }}
        onCancel={() => setAddGroupVisible(false)}
      >
        <Form
          form={addGroupForm}
          onFinish={(v: any) => {
            addSpaceGroupReq.run(currentSpace.id, { name: v.name });
            addGroupForm.resetFields();
          }}
        >
          <Form.Item
            label="小组名"
            name="name"
            rules={[{ required: true, message: '小组名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Resource;
