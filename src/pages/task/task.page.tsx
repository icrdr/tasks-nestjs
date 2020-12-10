import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography, Button, message } from 'antd';
import { Access, useAccess, useRequest } from 'umi';
import EditorJs from 'react-editor-js';
import { EDITOR_JS_TOOLS } from '@/components/tools';
import DragDrop from 'editorjs-drag-drop';
import EditorJS from '@editorjs/editorjs';
import ProCard from '@ant-design/pro-card';
import Header from '@editorjs/header';
import { updateTask } from './task.service';
import { getTask } from '../adminTask/adminTask.service';


const Task: React.FC<{}> = () => {
  const getTaskReq = useRequest(() => getTask(1), {});
  return (
    <PageContainer>
      <ProCard>
      </ProCard>
    </PageContainer>
  );
};
export default Task;
