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
import { getUsersByfullName } from '../../task/task.service';
import { addSpaceMember } from '../member.service';

const AddMemberForm: React.FC<{
  disabled?: boolean;
  onSuccess?: Function;
}> = ({ onSuccess = () => {}, disabled = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const intl = useIntl();

  const addSpaceMemberReq = useRequest(addSpaceMember, {
    manual: true,
    onSuccess: (res) => {
      onSuccess();
    },
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

  const addMemberBtn = intl.formatMessage({
    id: 'addMemberForm.addMember.btn',
  });

  const membersTit = intl.formatMessage({
    id: 'addMemberForm.members.tit',
  });

  const membersPhd = intl.formatMessage({
    id: 'addMemberForm.members.phd',
  });

  // const nameRule = [
  //   {
  //     required: true,
  //     message: intl.formatMessage({
  //       id: 'addMemberForm.name.required',
  //     }),
  //   },
  // ];

  return (
    <ModalForm
      title={addMemberBtn}
      trigger={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={disabled || addSpaceMemberReq.loading}
        >
          {addMemberBtn}
        </Button>
      }
      onFinish={async (value: any) => {
        // console.log(value.userId);
        addSpaceMemberReq.run(currentSpace.id, value.userId[0]);
        return true;
      }}
    >
      <ProForm.Group>
        <ProFormSelect
          width="m"
          name="userId"
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

export default AddMemberForm;
