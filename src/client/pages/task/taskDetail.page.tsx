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
  InputNumber,
  Input,
  Badge,
  Popconfirm,
  Divider,
  Tag,
} from 'antd';
import TaskState from '../../components/TaskState';
import { EditOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import { TaskMoreDetailRes } from '@dtos/task.dto';
import moment from 'moment';
import { getSpaceMembers } from '../member/member.service';
import { UserRes } from '@dtos/user.dto';
import { AssignmentRes } from '@dtos/assignment.dto';

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
  const [viewUpdate, setViewUpdate] = useState(false);
  const [isEditingTitle, setEditingTitle] = useState(false);
  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';

  const getTaskReq = useRequest(() => getTask(currentTaskId), {
    refreshDeps: [dataUpdate],
    onSuccess: (res) => {
      res.contents.reverse();
      setTask(res);
    },
    onError: (err) => {
      history.goBack();
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

  const changeTaskStateReq = useRequest(changeTaskState, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const saveTaskContentReq = useRequest(saveTaskContent, {
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

  const removeTaskReq = useRequest(removeTask, {
    manual: true,
    onSuccess: (res) => {
      history.goBack();
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
        {isEditingTitle ? (
          <Input
            defaultValue={task?.name}
            onPressEnter={(e) => {
              e.preventDefault();
              const v = e.currentTarget.value;
              if (v) changeTaskReq.run(currentTaskId, { name: v });
              setEditingTitle(false);
            }}
          />
        ) : (
          <span>
            {task?.name}
            {isFull && (
              <Button type={'link'} icon={<EditOutlined />} onClick={() => setEditingTitle(true)} />
            )}
          </span>
        )}
      </Space>
    );
  };

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
    <Descriptions labelStyle={{ lineHeight: '32px' }} column={2}>
      <Descriptions.Item key="due" label="计划日期" span={2} contentStyle={{ lineHeight: '32px' }}>
        {isFull ? (
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
          <Space size="large">
            <span>{`开始日期 ${
              task?.beginAt ? moment(task.beginAt).format('YYYY/MM/DD') : '/'
            }`}</span>
            <span>{`死线日期 ${task?.dueAt ? moment(task.dueAt).format('YYYY/MM/DD') : '/'}`}</span>
          </Space>
        )}
      </Descriptions.Item>
      <Descriptions.Item key="priority" label="优先级" contentStyle={{ lineHeight: '32px' }}>
        {isFull ? (
          <InputNumber
            value={task?.priority}
            onChange={(v: number) => changeTaskReq.run(currentTaskId, { priority: v })}
          />
        ) : (
          <span>
            <Badge className="badge-priority" count={task?.priority} />
          </span>
        )}
      </Descriptions.Item>
      <Descriptions.Item key="access" label="默认权限" contentStyle={{ lineHeight: '32px' }}>
        {isFull ? (
          <Select
            value={task?.access}
            onChange={(v) => changeTaskReq.run(currentTaskId, { access: v })}
          >
            <Select.Option value="full">完全</Select.Option>
            <Select.Option value="edit">编辑</Select.Option>
            <Select.Option value="view">浏览</Select.Option>
            <Select.Option value={null}>无</Select.Option>
          </Select>
        ) : (
          <span>
            {task?.access === 'full'
              ? '完全'
              : task?.access === 'edit'
              ? '编辑'
              : task?.access === 'view'
              ? '浏览'
              : '无'}
          </span>
        )}
      </Descriptions.Item>
      {currentSpace.taskProperties.map((property, index) => {
        const value = task?.properties
          ? task.properties['prop' + property.id]?.toString()
          : undefined;
        const form = property.form;
        let itemRender;
        switch (form) {
          case 'string':
            itemRender = (
              <Text
                editable={
                  isFull
                    ? {
                        onChange: (v: string) => {
                          const properties = task.properties || {};
                          properties['prop' + property.id] = v;
                          if (v) changeTaskReq.run(currentTaskId, { properties });
                        },
                      }
                    : false
                }
              >
                {value}
              </Text>
            );
            break;
          case 'number':
            itemRender = isFull ? (
              <InputNumber
                value={value}
                onChange={(v: number) => {
                  const properties = task.properties || {};
                  properties['prop' + property.id] = v;
                  if (v) changeTaskReq.run(currentTaskId, { properties });
                }}
              />
            ) : (
              <Badge className="badge-priority" count={value} />
            );
            break;
          case 'radio':
            itemRender = isFull ? (
              <Select
                style={{ width: '100%' }}
                value={value}
                onChange={(v) => {
                  const properties = task.properties || {};
                  properties['prop' + property.id] = v;
                  if (v) changeTaskReq.run(currentTaskId, { properties });
                }}
                allowClear
              >
                {property.items &&
                  Object.entries(property.items).map((item: [string, { color: string }]) => {
                    return (
                      <Select.Option key={item[0]} value={item[0]}>
                        {item[0]}
                      </Select.Option>
                    );
                  })}
              </Select>
            ) : (
              <Tag color={property.items[value]?.color}>{value}</Tag>
            );
            break;
          case 'select':
            itemRender = isFull ? (
              <Select
                style={{ width: '100%' }}
                mode="multiple"
                value={value ? value.split(',') : undefined}
                onChange={(v) => {
                  const properties = task.properties || {};
                  properties['prop' + property.id] = v.join(',');
                  if (v) changeTaskReq.run(currentTaskId, { properties });
                }}
                options={Object.entries(property.items).map((item: [string, { color: string }]) => {
                  return { label: item[0], value: item[0] };
                })}
                allowClear
              />
            ) : (
              value?.split(',').map((v, i) => (
                <Tag key={i} color={property.items[v]?.color}>
                  {v}
                </Tag>
              ))
            );
            break;
        }
        return (
          <Descriptions.Item
            contentStyle={{ lineHeight: '32px' }}
            key={property.id + index}
            label={property.name}
          >
            <span style={{ width: '100%' }}>{itemRender}</span>
          </Descriptions.Item>
        );
      })}
      {currentSpace.roles.map((role, index) => (
        <Descriptions.Item key={role.id + index} label={role.name}>
          <Space size={'small'} align="start">
            <Avatar.Group>
              {task?.roles[role.id]?.map((assignment: AssignmentRes, index: number) => (
                <Dropdown
                  disabled={!isFull}
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
                  <Tooltip title={assignment.name || (assignment?.users[0] as UserRes).username}>
                    <Avatar>{assignment.name || (assignment?.users[0] as UserRes).username}</Avatar>
                  </Tooltip>
                </Dropdown>
              ))}
            </Avatar.Group>
            {isFull && (
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
    {
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
      return React.cloneElement(child, { task: task, update: task?.state });
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
      // loading cause unnecessary update child component which causing editor uncertain rebuilding
      // loading={getTaskReq.loading}
      tabList={tabList}
    >
      {task && childrenWithProps}
    </PageContainer>
  );
};
export default taskDetail;
