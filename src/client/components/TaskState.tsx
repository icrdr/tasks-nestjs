import { Alert, Badge } from 'antd';
import React from 'react';
import { useIntl } from 'umi';

const TaskState: React.FC<{ state?: string }> = ({ state }) => {
  const intl = useIntl();
  const taskStateSuspended = intl.formatMessage({
    id: 'taskState.suspended',
  });

  const taskStateInProgress = intl.formatMessage({
    id: 'taskState.inProgress',
  });

  const taskStateUnconfirmed = intl.formatMessage({
    id: 'taskState.unconfirmed',
  });

  const taskStateCompleted = intl.formatMessage({
    id: 'taskState.completed',
  });

  const taskStateUnknown = intl.formatMessage({
    id: 'taskState.unknown',
  });
  switch (state) {
    case 'suspended':
      return <Alert  type="error" message={taskStateSuspended} showIcon />;
    case 'inProgress':
      return <Alert  type="info" message={taskStateInProgress} showIcon />;
    case 'unconfirmed':
      return <Alert  type="warning" message={taskStateUnconfirmed} showIcon />;
    case 'completed':
      return <Alert  type="success" message={taskStateCompleted} showIcon />;
    default:
      return <Alert  type="error" message={taskStateUnknown} />;
  }
};
export default TaskState;
