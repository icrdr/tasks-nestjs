import React from 'react';
import TaskView from './components/TaskView';

const Task: React.FC<{}> = () => {
  return (
    <div style={{ padding: 20 }}>
      <TaskView />
    </div>
  );
};
export default Task;
