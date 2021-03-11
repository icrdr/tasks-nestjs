import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Link, useParams, useRequest, useModel, useLocation, useHistory } from 'umi';
import {
  addTaskAssignment,
  changeTask,
  changeTaskState,
  getSpaceGroups,
  removeTask,
  removeTaskAssignment,
  saveTaskContent,
} from './task.service';
import { getTask } from './task.service';
import { Space, Button, Dropdown, Menu, Typography, Descriptions, Popconfirm } from 'antd';
import TaskState from '../../components/TaskState';
import { EllipsisOutlined } from '@ant-design/icons';
import { TaskMoreDetailRes } from '@dtos/task.dto';
import { getSpaceMembers } from '../member/member.service';
import { AssignmentRes } from '@dtos/assignment.dto';
import PropertyItem from '@components/PropertyItem';
import PropertyAvatar from '@components/PropertyAvatar';
import { RoleRes } from '@dtos/role.dto';
import TaskContent from './taskContent.page';
import AssetView from '../asset/components/AssetView';
import TaskView from './components/TaskView';
import PropertyNumber from '@components/PropertyNumber';
import PropertyRadio from '@components/PropertyRadio';
import PropertyDateRange from '@components/PropertyDateRange';
import PropertyString from '@components/PropertyString';

const { Text, Title } = Typography;

const taskDetail: React.FC<{}> = (props) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const currentTaskId = (useParams() as any).id;
  const [memberOptions, setMemberOptions] = useState([]);
  const location = useLocation();
  const history = useHistory();
  const [tabKey, setTabKey] = useState('content');
  const [task, setTask] = useState<TaskMoreDetailRes>(null);
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';

  const getTaskReq = useRequest(() => getTask(currentTaskId), {
    refreshDeps: [currentTaskId],
    onSuccess: (res) => {
      res.contents.reverse();
      setViewUpdate(!viewUpdate);
      setTask(res);
      setTabKey('content');
    },
    onError: (err) => {
      history.goBack();
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
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
      const groupOptions = memberOptions.filter((option) => option.value.split(':')[0] === 'group');
      setMemberOptions(groupOptions);
      setTask(res);
    },
  });

  const removeAssignmentReq = useRequest(removeTaskAssignment, {
    manual: true,
    onSuccess: (res) => {
      setTask(res);
    },
  });

  const changeTaskStateReq = useRequest(changeTaskState, {
    manual: true,
    onSuccess: (res) => {
      setTask(res);
    },
  });

  const saveTaskContentReq = useRequest(saveTaskContent, {
    manual: true,
    onSuccess: (res) => {
      setTask(res);
    },
  });

  const changeTaskReq = useRequest(changeTask, {
    manual: true,
    onSuccess: (res) => {
      setTask(res);
    },
  });

  const removeTaskReq = useRequest(removeTask, {
    manual: true,
    onSuccess: (res) => {
      history.goBack();
    },
  });

  const title = (
    <Space>
      {task?.superTask && (
        <Link to={`/task/${task?.superTask.id}/content`}>{task?.superTask.name}</Link>
      )}
      <PropertyString
        value={task?.name}
        editable={isFull}
        onChange={(v) => changeTaskReq.run(currentTaskId, { name: v })}
      />
    </Space>
  );

  const otherActionMenu = (
    <Menu>
      <Menu.Item key="save" onClick={() => saveTaskContentReq.run(task.id)}>
        保存
      </Menu.Item>
      <Menu.Item key="delete">
        <Popconfirm
          title="你确定要删除该任务么？"
          onConfirm={() => removeTaskReq.run(task.id)}
          okText="确认"
          cancelText="取消"
        >
          <a href="#">删除</a>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  const extraContent = isFull ? (
    <Space>
      <Button.Group>
        {task?.state === 'suspended' && (
          <Button
            onClick={() => changeTaskStateReq.run(currentTaskId, 'start')}
            disabled={changeTaskStateReq.loading}
          >
            启动
          </Button>
        )}
        {task?.state === 'inProgress' && (
          <Button
            onClick={() => changeTaskStateReq.run(currentTaskId, 'suspend')}
            disabled={changeTaskStateReq.loading}
          >
            暂停
          </Button>
        )}
        {task?.state === 'completed' && (
          <Button
            onClick={() => changeTaskStateReq.run(currentTaskId, 'restart')}
            disabled={changeTaskStateReq.loading}
          >
            重启
          </Button>
        )}
        {task?.state === 'unconfirmed' && (
          <Button
            onClick={() => changeTaskStateReq.run(currentTaskId, 'refuse')}
            disabled={changeTaskStateReq.loading}
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
          onClick={() => changeTaskStateReq.run(currentTaskId, 'complete')}
          disabled={changeTaskStateReq.loading}
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
        onClick={() => changeTaskStateReq.run(currentTaskId, 'commit')}
        disabled={changeTaskStateReq.loading}
      >
        提交
      </Button>
    )
  );

  const description = (
    <Descriptions
      labelStyle={{ lineHeight: '32px' }}
      contentStyle={{ lineHeight: '32px' }}
      column={2}
    >
      <Descriptions.Item key="due" label="计划日期">
        <PropertyDateRange
          value={[task?.beginAt, task?.dueAt]}
          editable={isFull}
          onChange={(dates) =>
            changeTaskReq.run(currentTaskId, {
              beginAt: dates[0],
              dueAt: dates[1],
            })
          }
        />
      </Descriptions.Item>
      <Descriptions.Item key="priority" label="优先级">
        <PropertyNumber
          value={task?.priority}
          editable={isFull}
          onChange={(v) => changeTaskReq.run(currentTaskId, { priority: v })}
        />
      </Descriptions.Item>
      <Descriptions.Item key="access" label="默认权限">
        <PropertyRadio
          options={[
            { value: 'full', label: '完全' },
            { value: 'edit', label: '编辑' },
            { value: 'view', label: '浏览' },
            { value: null, label: '无' },
          ]}
          value={task?.access}
          editable={isFull}
          onChange={(v) => changeTaskReq.run(currentTaskId, { access: v })}
        />
      </Descriptions.Item>
      {currentSpace.taskProperties.map((property, index) => {
        const value = task?.properties
          ? task.properties['prop' + property.id]?.toString()
          : undefined;
        return (
          <Descriptions.Item key={property.id + index} label={property.name}>
            <PropertyItem
              property={property}
              value={value}
              editable={isFull}
              onChange={(v) => {
                const properties = task.properties || {};
                properties['prop' + property.id] = v;
                changeTaskReq.run(currentTaskId, { properties });
              }}
            />
          </Descriptions.Item>
        );
      })}
      {currentSpace.roles.map((role: RoleRes, index: number) => {
        const users = task?.roles[role.id]?.map((assignment: AssignmentRes) => {
          return assignment.name
            ? { id: assignment.id, username: assignment.name }
            : { id: assignment.id, username: assignment.users[0].username };
        });
        return (
          <Descriptions.Item key={role.id + index} label={role.name}>
            <PropertyAvatar
              users={users}
              editable={isFull}
              options={memberOptions}
              onAdd={(v) => {
                const type = v.split(':')[0];
                const id = parseInt(v.split(':')[1]);
                if (type === 'user') {
                  addAssignmentReq.run(currentTaskId, {
                    userId: [id],
                    roleName: role.name,
                  });
                } else {
                  addAssignmentReq.run(currentTaskId, {
                    groupId: id,
                  });
                }
              }}
              searchLoading={getSpaceMembersReq.loading}
              onRemove={(id) => removeAssignmentReq.run(currentTaskId, id)}
              onSearch={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
            />
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );

  const tabList = [
    {
      key: 'content',
      tab: '内容',
    },
    {
      key: 'asset',
      tab: '资源',
    },
    {
      key: 'subTask',
      tab: '子任务',
    },
  ];

  return (
    <PageContainer
      title={title}
      extra={<TaskState state={task?.state} />}
      extraContent={extraContent}
      content={description}
      tabActiveKey={tabKey}
      onTabChange={(v) => setTabKey(v)}
      // loading cause unnecessary update child component which causing editor uncertain rebuilding
      loading={getTaskReq.loading}
      tabList={tabList}
    >
      {task && tabKey === 'content' && <TaskContent task={task} update={viewUpdate} />}
      {task && tabKey === 'asset' && <AssetView task={task} update={viewUpdate} />}
      {task && tabKey === 'subTask' && <TaskView task={task} update={viewUpdate} />}
    </PageContainer>
  );
};
export default taskDetail;
