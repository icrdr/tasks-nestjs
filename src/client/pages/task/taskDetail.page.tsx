import React, { useContext, useRef, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { Link, useIntl, history, useParams, useRequest, useModel } from "umi";
import {
  addTaskAssignment,
  changeTask,
  changeTaskState,
  removeTaskAssignment,
} from "./task.service";
import { getTask } from "./task.service";
import {
  Space,
  Button,
  Descriptions,
  Dropdown,
  Menu,
  Input,
  Tag,
  Select,
  Avatar,
  DatePicker,
  Modal,
  Drawer,
  List,
  Typography,
  Form,
} from "antd";
import TaskState from "../../components/TaskState";
import {
  AntDesignOutlined,
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ProDescriptions, {
  ProDescriptionsActionType,
} from "@ant-design/pro-descriptions";
import ProProvider from "@ant-design/pro-provider";
import type { ProColumns } from "@ant-design/pro-table";
import { TaskMoreDetailRes, TaskRes } from "@dtos/task.dto";
import { AssignmentRes, MemberRes } from "@dtos/space.dto";
import moment from "moment";
import { getSpaceMembers } from "../member/member.service";
import ProForm, { ProFormText } from "@ant-design/pro-form";
const { Text, Title } = Typography;

const taskDetail: React.FC<{}> = (props) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const currentTaskId = (useParams() as any).id;
  const [isModalVisible, setModalVisible] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const intl = useIntl();
  const [form] = Form.useForm();
  const path = history.location.pathname.split("/");
  const tabActiveKey = path[path.length - 1];
  const [task, setTask] = useState(null);
  const [isEditingName, setEditingName] = useState(false);
  const [EditName, setEditName] = useState("");
  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setMemberList(res.list);
    },
  });

  const addAssignmentReq = useRequest(addTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      actionRef.current?.reload();
    },
  });

  const removeAssignmentReq = useRequest(removeTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      actionRef.current?.reload();
    },
  });

  const changeStateReq = useRequest(changeTaskState, {
    manual: true,
    onSuccess: (res) => {
      actionRef.current?.reload();
    },
  });

  const changeTaskReq = useRequest(changeTask, {
    manual: true,
    onSuccess: (res) => {
      actionRef.current?.reload();
    },
  });

  const handleTabChange = (tabActiveKey: string) => {
    history.push(`/task/${currentTaskId}/${tabActiveKey}`);
  };

  const tabContents = intl.formatMessage({
    id: "page.taskContent.tab.contents",
  });

  const tabAssets = intl.formatMessage({
    id: "page.taskContent.tab.assets",
  });

  const tabSubTasks = intl.formatMessage({
    id: "page.taskContent.tab.subTasks",
  });

  const title = () => {
    const superTask = task?.superTask;
    return (
      <Space>
        {superTask && (
          <Link to={`/task/${superTask.id}`}>{superTask.name}</Link>
        )}
        {superTask && <span>/</span>}
        {isEditingName ? (
          <Form
            form={form}
            layout="inline"
            onFinish={(v) => {
              console.log(v);
              changeTaskReq.run(currentTaskId, { name: v.name });
              setEditingName(false);
            }}
            initialValues={{ name: task?.name }}
          >
            <Form.Item name="name">
              <Input placeholder="请输入名称" />
            </Form.Item>
            <Form.Item shouldUpdate={true}>
              {() => (
                <Button
                  type="link"
                  htmlType="submit"
                  disabled={!form.getFieldValue("name")}
                >
                  确认
                </Button>
              )}
            </Form.Item>
          </Form>
        ) : (
          <>
            <span>{task?.name}</span>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => setEditingName(true)}
            />
          </>
        )}
      </Space>
    );
  };

  const otherActionMenu = (
    <Menu>
      <Menu.Item key="1">删除</Menu.Item>
    </Menu>
  );
  const extraContent = (
    <Space>
      <Button.Group>
        {task?.state === "suspended" && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, "start")}
            disabled={changeStateReq.loading}
          >
            启动
          </Button>
        )}
        {task?.state === "inProgress" && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, "suspend")}
            disabled={changeStateReq.loading}
          >
            暂停
          </Button>
        )}
        {task?.state === "completed" && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, "restart")}
            disabled={changeStateReq.loading}
          >
            重启
          </Button>
        )}
        {task?.state === "inProgress" && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, "commit")}
            disabled={changeStateReq.loading}
          >
            提交
          </Button>
        )}
        {task?.state === "unconfirmed" && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, "refuse")}
            disabled={changeStateReq.loading}
          >
            打回
          </Button>
        )}
        <Dropdown overlay={otherActionMenu} placement="bottomRight">
          <Button>
            <EllipsisOutlined />
          </Button>
        </Dropdown>
      </Button.Group>
      {task?.state !== "completed" && (
        <Button
          type="primary"
          onClick={() => changeStateReq.run(currentTaskId, "complete")}
          disabled={changeStateReq.loading}
        >
          完成
        </Button>
      )}
    </Space>
  );

  const columns: ProColumns<TaskMoreDetailRes>[] = [
    {
      title: "计划日期",
      dataIndex: "dueAt",
      render: (_, entity) => {
        return (
          <DatePicker.RangePicker
            ranges={{
              "Next One Week": [moment(), moment().add(7, "d")],
            }}
            defaultValue={[
              entity.beginAt ? moment(entity.beginAt) : undefined,
              entity.dueAt ? moment(entity.dueAt) : undefined,
            ]}
            onChange={(dates) => {
              if (!dates) {
                changeTaskReq.run(currentTaskId, {
                  beginAt: null,
                  dueAt: null,
                });
              } else {
                changeTaskReq.run(currentTaskId, {
                  beginAt: dates[0]?.toDate(),
                  dueAt: dates[1]?.toDate(),
                });
              }
            }}
          />
        );
      },
    },
    {
      title: "默认权限",
      dataIndex: "access",
      render: (_, entity) => {
        return (
          <Select
            defaultValue={entity.access}
            //@ts-ignore
            onChange={(v) => changeTaskReq.run(currentTaskId, { access: v })}
          >
            <Select.Option value="view">浏览</Select.Option>
            <Select.Option value="edit">编辑</Select.Option>
            <Select.Option value="full">完全</Select.Option>
          </Select>
        );
      },
    },
  ];

  const handleAddAssignment = (userId: number[], roleName: string) => {
    addAssignmentReq.run(currentTaskId, {
      userId,
      roleName,
    });
    setModalVisible(false);
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    removeAssignmentReq.run(currentTaskId, assignmentId);
  };

  for (const role of currentSpace.roles) {
    const _role = role as string;
    columns.push({
      title: _role,
      dataIndex: _role,
      editable: false,
      render: (_, entity) => {
        const assignments = entity["roles"][_role];
        return (
          <Space size={"small"} align="start">
            <Avatar.Group>
              {assignments.map((assignment: AssignmentRes, index: number) => (
                <Dropdown
                  overlay={
                    <Menu>
                      <Menu.Item
                        key="1"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                      >
                        删除
                      </Menu.Item>
                    </Menu>
                  }
                  key={index}
                  trigger={["contextMenu"]}
                >
                  <Avatar>
                    {(assignment.members[0] as MemberRes).username}
                  </Avatar>
                </Dropdown>
              ))}
            </Avatar.Group>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              shape="circle"
              style={{ padding: 0 }}
              onClick={() => {
                setModalVisible(true);
                getSpaceMembersReq.run(currentSpace.id);
              }}
            />
            <Drawer
              visible={isModalVisible}
              title="成员列表"
              closable={false}
              width={300}
              placement="right"
              getContainer={false}
              bodyStyle={{ padding: 0 }}
              onClose={() => setModalVisible(false)}
            >
              <List
                loading={getSpaceMembersReq.loading}
                dataSource={getSpaceMembersReq.data?.list}
                split={true}
                renderItem={(member, index) => {
                  const _assignments = assignments.filter(
                    (a) => a.members.length === 1
                  );
                  const _members = _assignments.map((a) => a.members[0].userId);
                  const isExist = _members.indexOf(member.userId) >= 0;
                  return (
                    <List.Item>
                      <Button
                        disabled={isExist}
                        type="link"
                        onClick={() =>
                          handleAddAssignment([member.userId], _role)
                        }
                      >
                        <Space>
                          <Avatar>{member.username}</Avatar>
                          <Text delete={isExist}>{member.username}</Text>
                        </Space>
                      </Button>
                    </List.Item>
                  );
                }}
              />
            </Drawer>
          </Space>
        );
      },
    });
  }
  const actionRef = useRef<ProDescriptionsActionType>();
  const description = (
    <ProDescriptions<TaskMoreDetailRes>
      labelStyle={{ lineHeight: "32px" }}
      actionRef={actionRef}
      //@ts-ignore
      columns={columns}
      column={1}
      request={async () => {
        const res = await getTask(currentTaskId);
        setTask(res);
        return {
          data: res,
          success: true,
        };
      }}
    />
  );

  const tabList = [
    {
      key: "content",
      tab: tabContents,
    },
    {
      key: "asset",
      tab: tabAssets,
    },
    {
      key: "subTask",
      tab: tabSubTasks,
    },
  ];

  return (
    <PageContainer
      title={title()}
      extra={<TaskState state={task?.state} />}
      extraContent={extraContent}
      content={description}
      tabActiveKey={tabActiveKey}
      onTabChange={handleTabChange}
      loading={!task}
      tabList={tabList}
    >
      {props.children}
    </PageContainer>
  );
};
export default taskDetail;
