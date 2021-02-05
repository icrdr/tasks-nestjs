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
import { createSpace } from '../layout.service';
import Cookies from 'js-cookie';

const CreateSpaceForm: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const intl = useIntl();
  const { initialState, setInitialState } = useModel('@@initialState');

  const createSpaceReq = useRequest(createSpace, {
    manual: true,
  });

  const createSpaceBtn = intl.formatMessage({
    id: 'createSpaceFrom.createSpace.btn',
  });

  const nameTit = intl.formatMessage({
    id: 'createSpaceFrom.name.tit',
  });

  const namePhd = intl.formatMessage({
    id: 'createSpaceFrom.name.phd',
  });

  const nameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'createSpaceFrom.name.required',
      }),
    },
  ];

  return (
    <ModalForm
      title={createSpaceBtn}
      trigger={
        <Button type="link" icon={<ExpandOutlined />} disabled={disabled || createSpaceReq.loading}>
          新空间
        </Button>
      }
      onFinish={async (value: any) => {
        console.log(value);
        try {
          const currentSpace = await createSpaceReq.run(value);
          console.log(currentSpace);
          setInitialState({ ...initialState, currentSpace });
          Cookies.set('space', currentSpace.id.toString());
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
