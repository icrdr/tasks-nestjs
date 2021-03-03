import React, { useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { history, useModel, useRequest } from "umi";
import { Button, Form, Input, Modal, Space } from "antd";
import RoleTable from "./components/MemberTable";
import { add } from "./setting.service";

const Resource: React.FC<{}> = (props) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [form] = Form.useForm();
  const [update, setUpdate] = useState(false);

  const addRoleReq = useRequest(addRole, {
    manual: true,
    onSuccess: (res) => {
      setUpdate(!update);
    },
  });

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: "100%" }}>
        <div>
          <Button
            type="primary"
            style={{ marginRight: "20px" }}
            onClick={() => setModalVisible(true)}
          >
            新角色
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
          name="name"
          form={form}
          onFinish={(v: any) => {
            addRoleReq.run(currentSpace.id,{name:v.name});
            form.resetFields();
          }}
        >
          <Form.Item
            label="角色名"
            name="name"
            rules={[{ required: true, message: "角色名是必须的" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Resource;
