import React, { useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Avatar, Table, Space } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { useIntl, history } from 'umi';
import { getTasks } from '../adminTask.service';
import { TaskRes } from '@/dtos/task.dto';

const TaskTable: React.FC<{ headerTitle?: string; showParentTask?: boolean }> = ({
  headerTitle = '',
  showParentTask = true,
}) => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const actionMenu = [
    { key: 'copy', name: '复制' },
    { key: 'delete', name: '删除' },
  ];
  const createTaskBtn = intl.formatMessage({
    id: 'taskTable.createTask.btn',
  });

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
    id: 'taskTable.state.suspended',
  });
  const stateInProgress = intl.formatMessage({
    id: 'taskTable.state.inProgress',
  });
  const stateUnconfirmed = intl.formatMessage({
    id: 'taskTable.state.unconfirmed',
  });
  const stateCompleted = intl.formatMessage({
    id: 'taskTable.state.completed',
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
      dataIndex: 'created_at',
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

  if (showParentTask)
    columns.splice(0, 0, {
      title: parentTit,
      render: (_, record) => (
        <a onClick={() => history.push('/admin/task/' + record.parentTask?.id)}>
          {record.parentTask?.name}
        </a>
      ),
    });

  return (
    <ProTable<TaskRes>
      headerTitle={headerTitle}
      rowKey="id"
      columns={columns}
      actionRef={actionRef}
      request={async (params, sorter, filter) => {
        const res = await getTasks({ ...params, ...filter });
        console.log(res);
        return {
          data: res.list,
          success: true,
          total: res.total,
        };
      }}
      options={{
        fullScreen: true
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
        <Button key="button" icon={<PlusOutlined />} type="primary">
          {createTaskBtn}
        </Button>,
      ]}
    />
  );
};
export default TaskTable;
