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
import { ExpandOutlined, PlusOutlined } from '@ant-design/icons';
import { addSpace } from '../layout.service';
import Cookies from 'js-cookie';

const CreateSpaceForm: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');

  const addSpaceReq = useRequest(addSpace, {
    manual: true,
  });

  const addSpaceBtn = intl.formatMessage({
    id: 'addSpaceFrom.addSpace.btn',
  });

  const nameTit = intl.formatMessage({
    id: 'addSpaceFrom.name.tit',
  });

  const namePhd = intl.formatMessage({
    id: 'addSpaceFrom.name.phd',
  });

  const nameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'addSpaceFrom.name.required',
      }),
    },
  ];

  return (
    <ModalForm
      title={addSpaceBtn}
      trigger={
        <Button type="link" icon={<ExpandOutlined />} disabled={disabled || addSpaceReq.loading}>
          新空间
        </Button>
      }
      onFinish={async (value: any) => {
        console.log(value);
        try {
          const currentSpace = await addSpaceReq.run(value);
          console.log(currentSpace);
          setInitialState({ ...initialState, currentSpace });
          Cookies.set('space', currentSpace.id.toString());
          history.push('/');
          return true;
        } catch (error) {
          return false;
        }
      }}
    >
      <ProFormText width="m" name="name" label={nameTit} placeholder={namePhd} rules={nameRule} />
    </ModalForm>
  );
};

export default CreateSpaceForm;
