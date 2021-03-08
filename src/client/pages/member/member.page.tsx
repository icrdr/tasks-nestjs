import React, { useEffect, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import {
  Button,
  DatePicker,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
} from 'antd';
import RoleTable from './components/MemberTable';
import { addSpaceGroup, addSpaceMember, getSpaceMembers } from './member.service';
import MemberTable from './components/MemberTable';
import { getUsers } from '../task/task.service';
import GroupList from './components/GroupList';
import { SettingOutlined } from '@ant-design/icons';
import { ViewOption } from '@server/common/common.entity';
import { getInitViewOption } from '@utils/utils';

const Resource: React.FC<{}> = (props) => {
  
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [addMemberForm] = Form.useForm();
  const [addGroupForm] = Form.useForm();
  const [isAddMemberVisible, setAddMemberVisible] = useState(false);
  const [isAddGroupVisible, setAddGroupVisible] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [groupUpdate, setGroupUpdate] = useState(false);
  const [memberUpdate, setMemberUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);

  const [type, setType] = useState('member');
  const viewOptionKey = `spaceMemberViewOption`;

  useEffect(() => {
    const initViewOption = getInitViewOption(JSON.parse(localStorage.getItem(viewOptionKey)), {
      form: 'gallery',
      headers: [
        {
          title: 'username',
          width: 150,
          filter: undefined,
          hidden: false,
        },
      ],
    });

    setViewOption(initViewOption);
  }, []);

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
  };

  const handleSeletForm = (v) => {
    console.log(v);
    saveOption({ ...viewOption, form: v });
  };

  const handleFilter = (index, v) => {
    const headers = viewOption.headers;
    headers[index].filter = v;
    saveOption({ ...viewOption, headers });
  };
  const handleHeaderDisplay = (index, v) => {
    const headers = viewOption.headers;
    headers[index].hidden = !v;
    saveOption({ ...viewOption, headers });
  };

  const filter = viewOption?.headers
    .filter((header) => !header.hidden)
    .map((header, index: number) => {
      const type = header.title.split(':')[0];
      switch (type) {
        case 'username':
          return (
            <Input.Search
              key={index}
              style={{ width: 150 }}
              placeholder="用户名"
              onSearch={(v) => handleFilter(index, v)}
              defaultValue={header.filter || ''}
              allowClear
            />
          );
        default:
          <div></div>;
      }
    });

  const menu = (
    <Menu>
      {viewOption?.headers.map((header, index) => {
        const type = header.title.split(':')[0];
        let title = type;

        let label = '';
        switch (title) {
          case 'username':
            label = '用户名';
            break;
          default:
            label = title;
            break;
        }
        return (
          <Menu.Item key={index}>
            <Space>
              <Switch
                disabled={title === 'username'}
                size="small"
                defaultChecked={!header.hidden}
                onChange={(v) => handleHeaderDisplay(index, v)}
              />
              <span>{label}</span>
            </Space>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" onClick={() => setAddGroupVisible(true)}>
          新小组
        </Button>
        <GroupList update={groupUpdate} />
        <div>
          <Space>
            <Button type="primary" onClick={() => setAddMemberVisible(true)}>
              新成员
            </Button>
            <Dropdown overlay={menu}>
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
          <Space style={{ float: 'right' }}>{filter}</Space>
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
