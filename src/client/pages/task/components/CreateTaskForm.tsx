import React, { useState } from 'react';
import { Button, message, Spin } from 'antd';
import { BackgroundColor } from 'chalk';
import { useIntl, history, Link, useRequest, useModel } from 'umi';
import Mock from 'mockjs';

import ProForm, {
  ModalForm,
  ProFormText,
  ProFormDateRangePicker,
  ProFormSelect,
} from '@ant-design/pro-form';
import { PlusOutlined } from '@ant-design/icons';
import { createSubTask, createSpaceTask, getUsersByfullName } from '../task.service';

const CreateTaskForm: React.FC<{ disabled?: boolean; superTaskId?: number; onSuccess?: Function }> = ({
  onSuccess = () => {},
  superTaskId,
  disabled = false,
}) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const intl = useIntl();

  const createSpaceTaskReq = useRequest(createSpaceTask, {
    manual: true,
  });

  const createSubTaskReq = useRequest(createSubTask, {
    manual: true,
  });

  const getUsersReq = useRequest(getUsersByfullName, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      let valueEnum = {};
      res.list.map((item) => {
        valueEnum[item.id] = item.username;
      });
      console.log(valueEnum);
      setValueEnum(valueEnum);
    },
  });

  const [state, setstate] = useState([]);
  const [valueEnum, setValueEnum] = useState({});

  const createTaskBtn = intl.formatMessage({
    id: 'createTaskFrom.createTask.btn',
  });

  const createSubTaskBtn = intl.formatMessage({
    id: 'createTaskFrom.createSubTask.btn',
  });

  const nameTit = intl.formatMessage({
    id: 'createTaskFrom.name.tit',
  });

  const namePhd = intl.formatMessage({
    id: 'createTaskFrom.name.phd',
  });

  const membersTit = intl.formatMessage({
    id: 'createTaskFrom.members.tit',
  });

  const membersPhd = intl.formatMessage({
    id: 'createTaskFrom.members.phd',
  });

  const nameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'createTaskFrom.name.required',
      }),
    },
  ];

  return (
    <ModalForm
      title={superTaskId ? createSubTaskBtn : createTaskBtn}
      trigger={
        <Button type="primary" disabled={disabled || createSpaceTaskReq.loading}>
          <PlusOutlined />
          {superTaskId ? createSubTaskBtn : createTaskBtn}
        </Button>
      }
      onFinish={async (value: any) => {
        console.log(value)
        try {
          superTaskId
            ? await createSubTaskReq.run(superTaskId, value)
            : await createSpaceTaskReq.run(currentSpace.id, value);
          onSuccess();
          return true;
        } catch (error) {
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText width="m" name="name" label={nameTit} placeholder={namePhd} rules={nameRule} />
        <ProFormSelect
          width="m"
          name="memberId"
          label={membersTit}
          placeholder={membersPhd}
          valueEnum={valueEnum}
          fieldProps={{
            mode: 'multiple',
            filterOption: false,
            onSearch: (value) => getUsersReq.run(value),
          }}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default CreateTaskForm;
