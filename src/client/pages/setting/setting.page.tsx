import React, { useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { history, useModel, useRequest } from "umi";
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import RoleTable from "./components/RoleTable";
import { addSpaceRole, changeSpace } from "./setting.service";
import { AccessLevel } from "@server/common/common.entity";
const { Text, Title } = Typography;
const Setting: React.FC<{}> = (props) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [form] = Form.useForm();
  const [viewUpdate, setViewUpdate] = useState(false);

  const addSpaceRoleReq = useRequest(addSpaceRole, {
    manual: true,
    onSuccess: (res) => {
      setViewUpdate(!viewUpdate);
    },
  });

  const changeSpaceReq = useRequest(changeSpace, {
    manual: true,
    onSuccess: (res) => {
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: "100%" }}>
        <Card>
          <Descriptions labelStyle={{ lineHeight: "32px" }} column={2}>
            <Descriptions.Item key="name" label="空间名">
              <Input
                style={{ width: "200px" }}
                defaultValue={currentSpace?.name}
                onPressEnter={(e) => {
                  e.preventDefault();
                  changeSpaceReq.run(currentSpace.id, {
                    name: e.currentTarget.value,
                  });
                }}
              />
            </Descriptions.Item>
            <Descriptions.Item key="access" label="空间默认权限">
              <Select
                value={currentSpace.access}
                onChange={(v) =>
                  changeSpaceReq.run(currentSpace.id, { access: v })
                }
              >
                <Select.Option value="full">完全</Select.Option>
                <Select.Option value="edit">编辑</Select.Option>
                <Select.Option value="view">浏览</Select.Option>
              </Select>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <div>
          <Button
            type="primary"
            style={{ marginRight: "20px" }}
            onClick={() => setModalVisible(true)}
          >
            新角色
          </Button>
        </div>
        <RoleTable update={viewUpdate} />
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
            addSpaceRoleReq.run(currentSpace.id, { name: v.name });
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
export default Setting;
