import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Link, useParams, useRequest, useModel, useLocation, useHistory } from 'umi';
import {
  addTaskAssignment,
  changeTask,
  changeTaskState,
  getSpaceGroups,
  removeTaskAssignment,
} from './task.service';
import { getTask } from './task.service';
import {
  Space,
  Button,
  Dropdown,
  Menu,
  Select,
  Avatar,
  DatePicker,
  Typography,
  Popover,
  Spin,
  Descriptions,
  Tooltip,
} from 'antd';
import TaskState from '../../components/TaskState';
import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import { TaskMoreDetailRes } from '@dtos/task.dto';
import { AssignmentRes, MemberRes } from '@dtos/space.dto';
import moment from 'moment';
import { getSpaceMembers } from '../member/member.service';

const { Text, Title } = Typography;

const taskDetail: React.FC<{}> = (props) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const currentTaskId = (useParams() as any).id;
  const [memberOptions, setMemberOptions] = useState([]);
  const location = useLocation();
  const history = useHistory();
  const path = location.pathname.split('/');
  const tabActiveKey = path[path.length - 1];
  const [task, setTask] = useState<TaskMoreDetailRes>(null);
  const [dataUpdate, setDataUpdate] = useState(false);
  const isAdmin = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEditable = isAdmin || task?.userAccess !== 'view';

  const getTaskReq = useRequest(() => getTask(currentTaskId), {
    refreshDeps: [dataUpdate],
    onSuccess: (res) => {
      res.contents.reverse();
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
          value: `user:${member.userId}`,
        };
      });
      const groupOptions = memberOptions.filter((option) => option.value.split(':')[0] === 'group');
      setMemberOptions([...groupOptions, ...memberOptions]);
    },
  });

  const getSpaceGroupsReq = useRequest(() => getSpaceGroups(currentSpace.id), {
    onSuccess: (res) => {
      console.log(res);
      const memberOptions = res.list.map((group) => {
        return {
          label: group.name,
          value: `group:${group.id}`,
        };
      });
      setMemberOptions(memberOptions);
    },
  });

  const addAssignmentReq = useRequest(addTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      const groupOptions = memberOptions.filter((option) => option.value.split(':')[0] === 'group');
      setMemberOptions(groupOptions);
      setDataUpdate(!dataUpdate);
    },
  });

  const removeAssignmentReq = useRequest(removeTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setDataUpdate(!dataUpdate);
    },
  });

  const changeStateReq = useRequest(changeTaskState, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const changeTaskReq = useRequest(changeTask, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const handleTabChange = (tabActiveKey: string) => {
    history.push(`/task/${currentTaskId}/${tabActiveKey}`);
  };

  const title = () => {
    const superTask = task?.superTask;
    return (
      <Space>
        {superTask && <Link to={`/task/${superTask.id}`}>{superTask.name}</Link>}
        {superTask && <span>/</span>}
        <Text
          style={{ width: '100%' }}
          editable={
            isAdmin
              ? {
                  onChange: (v) => {
                    if (v) changeTaskReq.run(currentTaskId, { name: v });
                  },
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
  const extraContent = isAdmin ? (
    <Space>
      <Button.Group>
        {task?.state === 'suspended' && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, 'start')}
            disabled={changeStateReq.loading}
          >
            启动
          </Button>
        )}
        {task?.state === 'inProgress' && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, 'suspend')}
            disabled={changeStateReq.loading}
          >
            暂停
          </Button>
        )}
        {task?.state === 'completed' && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, 'restart')}
            disabled={changeStateReq.loading}
          >
            重启
          </Button>
        )}
        {task?.state === 'unconfirmed' && (
          <Button
            onClick={() => changeStateReq.run(currentTaskId, 'refuse')}
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
      {task?.state !== 'completed' && (
        <Button
          type="primary"
          onClick={() => changeStateReq.run(currentTaskId, 'complete')}
          disabled={changeStateReq.loading}
        >
          完成
        </Button>
      )}
    </Space>
  ) : (
    task?.state === 'inProgress' &&
    task?.userAccess === 'edit' && (
      <Button
        type="primary"
        onClick={() => changeStateReq.run(currentTaskId, 'commit')}
        disabled={changeStateReq.loading}
      >
        提交
      </Button>
    )
  );

  const handleAddAssignment = (value: string, roleName: string) => {
    const type = value.split(':')[0];
    const id = parseInt(value.split(':')[1]);
    if (type === 'user') {
      addAssignmentReq.run(currentTaskId, {
        userId: [id],
        roleName,
      });
    } else {
      addAssignmentReq.run(currentTaskId, {
        groupId: id,
      });
    }
  };

  const handleRemoveAssignment = (assignmentId: number) => {
    removeAssignmentReq.run(currentTaskId, assignmentId);
  };

  const description = (
    <Descriptions labelStyle={{ lineHeight: '32px' }} column={1}>
      <Descriptions.Item key="due" label="计划日期">
        {isAdmin ? (
          <DatePicker.RangePicker
            ranges={{
              下周: [moment(), moment().add(7, 'd')],
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
          disabled={!isAdmin}
          value={task?.access}
          onChange={(v) => changeTaskReq.run(currentTaskId, { access: v })}
        >
          <Select.Option value="view">浏览</Select.Option>
          <Select.Option value="edit">编辑</Select.Option>
          <Select.Option value="full">完全</Select.Option>
        </Select>
      </Descriptions.Item>
      {currentSpace.roles.map((role, index) => (
        <Descriptions.Item key={index} label={role.name}>
          <Space size={'small'} align="start">
            <Avatar.Group>
              {task?.roles[role.id]?.map((assignment: AssignmentRes, index: number) => (
                <Dropdown
                  disabled={!isAdmin}
                  overlay={
                    <Menu>
                      <Menu.Item key="1" onClick={() => handleRemoveAssignment(assignment?.id)}>
                        删除
                      </Menu.Item>
                    </Menu>
                  }
                  key={index}
                  trigger={['contextMenu']}
                >
                  <Tooltip
                    title={assignment.name || (assignment?.members[0] as MemberRes).username}
                  >
                    <Avatar>
                      {assignment.name || (assignment?.members[0] as MemberRes).username}
                    </Avatar>
                  </Tooltip>
                </Dropdown>
              ))}
            </Avatar.Group>
            {isAdmin && (
              <Popover
                placement="right"
                content={
                  <Select
                    style={{ width: 100 }}
                    onChange={(v: string) => handleAddAssignment(v, role.name)}
                    onSearch={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
                    options={memberOptions}
                    showSearch
                    filterOption={false}
                    notFoundContent={getSpaceMembersReq.loading ? <Spin size="small" /> : null}
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
      key: 'content',
      tab: '内容',
    },
    isEditable && {
      key: 'asset',
      tab: '资源',
    },
    // {
    //   key: "subTask",
    //   tab: '子任务',
    // },
  ];
  const childrenWithProps = React.Children.map(props.children, (child) => {
    // checking isValidElement is the safe way and avoids a typescript error too
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { task: task });
    }
    return child;
  });

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
      {childrenWithProps}
    </PageContainer>
  );
};
export default taskDetail;
