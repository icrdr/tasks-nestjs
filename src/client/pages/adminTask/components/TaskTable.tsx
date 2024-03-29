import React, { useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Avatar, Table, Space } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { useIntl, history, Link } from 'umi';
import { getSubTasks, getTasks } from '../adminTask.service';
import { TaskDetailRes, TaskRes } from '@dtos/task.dto';
import TaskForm from './TaskForm';

const TaskTable: React.FC<{
  headerTitle?: string;
  parentTask?: TaskDetailRes;
}> = ({ headerTitle = '', parentTask }) => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const actionMenu = [
    { key: 'copy', name: '复制' },
    { key: 'delete', name: '删除' },
  ];

  const nameTit = intl.formatMessage({
    id: 'taskTable.name.tit',
  });

  const parentTit = intl.formatMessage({
    id: 'taskTable.parent.tit',
  });

  const stateTit = intl.formatMessage({
    id: 'taskTable.state.tit',
  });

  const tagTit = intl.formatMessage({
    id: 'taskTable.tag.tit',
  });

  const performersTit = intl.formatMessage({
    id: 'taskTable.performers.tit',
  });

  const createDataTit = intl.formatMessage({
    id: 'taskTable.createData.tit',
  });

  const stateSuspended = intl.formatMessage({
    id: 'taskState.suspended',
  });
  const stateInProgress = intl.formatMessage({
    id: 'taskState.inProgress',
  });
  const stateUnconfirmed = intl.formatMessage({
    id: 'taskState.unconfirmed',
  });
  const stateCompleted = intl.formatMessage({
    id: 'taskState.completed',
  });

  const actionTit = intl.formatMessage({
    id: 'taskTable.action.tit',
  });

  const columns: ProColumns<TaskRes>[] = [
    {
      dataIndex: 'name',
      title: nameTit,
      render: (_, record) => (
        <a onClick={() => history.push('/admin/task/' + record.id)}>{record.name}</a>
      ),
    },
    {
      dataIndex: 'state',
      title: stateTit,
      valueType: 'select',
      filters: true,
      valueEnum: {
        suspended: {
          text: stateSuspended,
          status: 'Default',
        },
        inProgress: {
          text: stateInProgress,
          status: 'Processing',
        },
        unconfirmed: {
          text: stateUnconfirmed,
          status: 'Warning',
        },
        completed: {
          text: stateCompleted,
          status: 'Success',
        },
      },
    },
    {
      title: performersTit,
      render: (_, record) => (
        <Avatar.Group>
          {record.performers.map(({ id, username }) => (
            <Avatar key={id} size="small">
              {username[0].toUpperCase()}
            </Avatar>
          ))}
        </Avatar.Group>
      ),
    },
    {
      dataIndex: 'createAt',
      title: createDataTit,
      valueType: 'date',
    },
    {
      title: actionTit,
      valueType: 'option',
      render: (text, record, _, action) => [
        <TableDropdown key="actionGroup" onSelect={() => action.reload()} menus={actionMenu} />,
      ],
    },
  ];

  if (!parentTask)
    columns.splice(0, 0, {
      title: parentTit,
      render: (_, record) => (
        <Link to={`/admin/task/${record.parentTask?.id}`}>{record.parentTask?.name}</Link>
      ),
    });

  return (
    <ProTable<TaskRes>
      headerTitle={headerTitle}
      rowKey="id"
      columns={columns}
      actionRef={actionRef}
      request={async (params, sorter, filter) => {
        const res = parentTask
          ? await getSubTasks(parentTask.id, { ...params, ...filter })
          : await getTasks({ ...params, ...filter });

        console.log(res);
        return {
          data: res.list,
          success: true,
          total: res.total,
        };
      }}
      options={{
        fullScreen: true,
      }}
      rowSelection={{
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
      }}
      tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space size="middle">
          <span>
            已选 {selectedRowKeys.length} 项
            <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
              取消选择
            </a>
          </span>
        </Space>
      )}
      tableAlertOptionRender={() => {
        return (
          <Space size="middle">
            <a>批量删除</a>
            <a>导出数据</a>
          </Space>
        );
      }}
      toolBarRender={() => [
        <TaskForm
          key="1"
          disabled={parentTask && parentTask?.state !== 'inProgress' && parentTask?.state !== 'suspended'}
          parentTaskId={parentTask?.id}
          onSuccess={() => actionRef.current.reload()}
        />,
      ]}
    />
  );
};
export default TaskTable;
