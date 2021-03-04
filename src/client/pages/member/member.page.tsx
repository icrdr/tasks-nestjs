import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { history, useModel, useRequest } from 'umi';
import { Button, Form, Input, Modal, Select, Space, Spin } from 'antd';
import RoleTable from './components/MemberTable';
import { addSpaceMember, getSpaceMembers } from './member.service';

const Resource: React.FC<{}> = (props) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [form] = Form.useForm();
  const [memberOptions, setMemberOptions] = useState([]);
  const [update, setUpdate] = useState(false);
  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);

      const memberOptions = res.list.map((member) => {
        return {
          label: member.username,
          value: member.userId,
        };
      });
      setMemberOptions(memberOptions);
    },
  });
  const addSpaceMemberReq = useRequest(addSpaceMember, {
    manual: true,
    onSuccess: (res) => {
      setUpdate(!update);
    },
  });

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <div>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setModalVisible(true)}
          >
            新成员
          </Button>
        </div>
        <RoleTable reload={update} />
      </Space>
      <Modal
        closable={false}
        visible={isModalVisible}
        onOk={() => {
          form.submit();
          setModalVisible(false);
        }}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          form={form}
          onFinish={(v: any) => {
            addSpaceMemberReq.run(currentSpace.id, v.user);
            form.resetFields();
          }}
        >
          <Form.Item
            label="用户"
            name="user"
            rules={[{ required: true, message: '用户名是必须的' }]}
          >
            <Select
              style={{ width: 100 }}
              onSearch={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
              options={memberOptions}
              showSearch
              showArrow={false}
              filterOption={false}
              notFoundContent={getSpaceMembersReq.loading ? <Spin size="small" /> : null}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Resource;
