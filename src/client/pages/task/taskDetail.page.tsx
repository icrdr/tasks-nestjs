import React, { useEffect, useRef, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import {
  Link,
  useIntl,
  useParams,
  useRequest,
  useModel,
  useLocation,
  useHistory,
} from "umi";
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
  Dropdown,
  Menu,
  Input,
  Select,
  Avatar,
  DatePicker,
  Drawer,
  List,
  Typography,
  Form,
  Popover,
  Spin,
  Descriptions,
} from "antd";
import TaskState from "../../components/TaskState";
import {
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import ProDescriptions, {
  ProDescriptionsActionType,
} from "@ant-design/pro-descriptions";
import type { ProColumns } from "@ant-design/pro-table";
import { TaskMoreDetailRes } from "@dtos/task.dto";
import { AssignmentRes, MemberRes } from "@dtos/space.dto";
import moment from "moment";
import { getSpaceMembers } from "../member/member.service";
import { AccessLevel } from "../../../server/task/entities/space.entity";
const { Text, Title } = Typography;

const taskDetail: React.FC<{}> = (props) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const currentTaskId = (useParams() as any).id;
  const [modalRoleId, setModalRoleId] = useState(undefined);
  const [vis, setVis] = useState(false);
  const [memberOptions, setMemberOptions] = useState([]);
  const intl = useIntl();
  const [form] = Form.useForm();
  const location = useLocation();
  const history = useHistory();
  const path = location.pathname.split("/");
  const tabActiveKey = path[path.length - 1];
  const [task, setTask] = useState<TaskMoreDetailRes>(null);
  const [isEditingName, setEditingName] = useState(false);
  const [EditName, setEditName] = useState("");
  const [columns, setColumns] = useState([]);

  const getTaskReq = useRequest(() => getTask(currentTaskId), {
    onSuccess: (res) => {
      setTask(res);
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      // const singleAssignments = task["roles"][modalRoleId]?.filter(
      //   (a) => a.members.length === 1
      // );
      // const memberUserIds = singleAssignments?.map(
      //   (a) => a.members[0].userId
      // );
      // const isExist = memberUserIds?.indexOf(member.userId) >= 0;
      const memberOptions = res.list.map((member) => {
        return {
          label: member.username,
          value: member.userId,
        };
      });
      setMemberOptions(memberOptions);
    },
  });

  const addAssignmentReq = useRequest(addTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      history.go(0);
    },
  });

  const removeAssignmentReq = useRequest(removeTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      history.go(0);
    },
  });

  const changeStateReq = useRequest(changeTaskState, {
    manual: true,
    onSuccess: (res) => {
      history.go(0);
    },
  });

  const changeTaskReq = useRequest(changeTask, {
    manual: true,
    onSuccess: (res) => {
      history.go(0);
    },
  });

  const handleTabChange = (tabActiveKey: string) => {
    history.push(`/task/${currentTaskId}/${tabActiveKey}`);
  };

  const title = () => {
    const superTask = task?.superTask;
    return (
      <Space>
        {superTask && (
          <Link to={`/task/${superTask.id}`}>{superTask.name}</Link>
        )}
        {superTask && <span>/</span>}
        <Text
          style={{ width: "100%" }}
          editable={
            task?.userAccess === "full"
              ? {
                  onChange: (v) =>{
                    if(v)changeTaskReq.run(currentTaskId, { name: v })},
                }
              : false
          }
        >
          {task?.name}
        </Text>
      </Space>
    );
  };

  const otherActionMenu = (
    <Menu>
      <Menu.Item key="1">删除</Menu.Item>
    </Menu>
  );
  const extraContent =
    task?.userAccess === "full" ? (
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
          {/* {task?.state === 'inProgress' && (
            <Button
              onClick={() => changeStateReq.run(currentTaskId, 'commit')}
              disabled={changeStateReq.loading}
            >
              提交
            </Button>
          )} */}
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
    ) : (
      task?.state === "inProgress" &&
      task?.userAccess === "edit" && (
        <Button
          type="primary"
          onClick={() => changeStateReq.run(currentTaskId, "commit")}
          disabled={changeStateReq.loading}
        >
          提交
        </Button>
      )
    );

  const handleAddAssignment = (userId: number[], roleName: string) => {
    addAssignmentReq.run(currentTaskId, {
      userId,
      roleName,
    });
    setModalRoleId(undefined);
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    removeAssignmentReq.run(currentTaskId, assignmentId);
  };

  const description = (
    <Descriptions labelStyle={{ lineHeight: "32px" }} column={1}>
      <Descriptions.Item key="due" label="计划日期">
        {task?.userAccess === "full" ? (
          <DatePicker.RangePicker
            ranges={{
              下周: [moment(), moment().add(7, "d")],
            }}
            value={[
              task?.beginAt ? moment(task?.beginAt) : undefined,
              task?.dueAt ? moment(task?.dueAt) : undefined,
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
        ) : (
          <DatePicker.RangePicker
            allowClear={false}
            bordered={false}
            disabledDate={() => true}
            value={[
              task?.beginAt ? moment(task.beginAt) : undefined,
              task?.dueAt ? moment(task.dueAt) : undefined,
            ]}
          />
        )}
      </Descriptions.Item>
      <Descriptions.Item key="access" label="默认权限">
        <Select
          disabled={task?.userAccess !== "full"}
          value={task?.access}
          onChange={(v) =>
            changeTaskReq.run(currentTaskId, { access: v as AccessLevel })
          }
        >
          <Select.Option value="view">浏览</Select.Option>
          <Select.Option value="edit">编辑</Select.Option>
          <Select.Option value="full">完全</Select.Option>
        </Select>
      </Descriptions.Item>
      {currentSpace.roles.map((role, index) => (
        <Descriptions.Item key={index} label={role.name}>
          <Space size={"small"} align="start">
            <Avatar.Group>
              {task?.roles[role.id]?.map(
                (assignment: AssignmentRes, index: number) => (
                  <Dropdown
                    disabled={task?.userAccess !== "full"}
                    overlay={
                      <Menu>
                        <Menu.Item
                          key="1"
                          onClick={() => handleRemoveAssignment(assignment?.id)}
                        >
                          删除
                        </Menu.Item>
                      </Menu>
                    }
                    key={index}
                    trigger={["contextMenu"]}
                  >
                    <Avatar>
                      {(assignment?.members[0] as MemberRes).username}
                    </Avatar>
                  </Dropdown>
                )
              )}
            </Avatar.Group>
            {task?.userAccess === "full" && (
              <Popover
                placement="right"
                content={
                  <Select
                    style={{ width: 100 }}
                    onChange={(v: number) =>
                      handleAddAssignment([v], role.name)
                    }
                    onSearch={(v) => getSpaceMembersReq.run(currentSpace.id)}
                    options={memberOptions}
                    showSearch
                    showArrow={false}
                    filterOption={false}
                    notFoundContent={
                      getSpaceMembersReq.loading ? <Spin size="small" /> : null
                    }
                  />
                }
              >
                <Button icon={<PlusOutlined />} type="primary" shape="circle" />
              </Popover>
            )}
          </Space>
        </Descriptions.Item>
      ))}
    </Descriptions>
  );

  const tabList = [
    {
      key: "content",
      tab: "内容",
    },
    {
      key: "asset",
      tab: "资源",
    },
    // {
    //   key: "subTask",
    //   tab: '子任务',
    // },
  ];

  return (
    <PageContainer
      title={title()}
      extra={<TaskState state={task?.state} />}
      extraContent={extraContent}
      content={description}
      tabActiveKey={tabActiveKey}
      onTabChange={handleTabChange}
      loading={getTaskReq.loading}
      tabList={tabList}
    >
      {props.children}
    </PageContainer>
  );
};
export default taskDetail;
