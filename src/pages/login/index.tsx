import React from 'react';
import { useIntl, history, FormattedMessage, useRequest } from 'umi';
import { Space, message, Typography, Col, Divider } from 'antd';
import { LockTwoTone, SmileTwoTone, WechatOutlined } from '@ant-design/icons';
import ProForm, { ProFormCheckbox, ProFormText } from '@ant-design/pro-form';
import { login, loginParams } from './service';
import Access from '@/components/Access';
import { getCurrentUser } from '../../service';
import Cookies from 'js-cookie'

const { Title } = Typography;

const LoginForm: React.FC = () => {
  const intl = useIntl();

  const successMsg = intl.formatMessage({
    id: 'pages.login.success.msg',
  });

  const submitBtn = intl.formatMessage({
    id: 'pages.login.submit.btn',
  });

  const errorMsg = intl.formatMessage({
    id: 'pages.login.error.msg',
  });

  const usernamePhd = intl.formatMessage({
    id: 'pages.login.username.phd',
  });

  const PasswordPhd = intl.formatMessage({
    id: 'pages.login.password.phd',
  });

  const rememberMeTex = intl.formatMessage({
    id: 'pages.login.rememberMe.tex',
  });

  const passwordRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'pages.login.username.required',
      }),
    },
  ];

  const usernameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'pages.login.password.required',
      }),
    },
  ];

  // const { setInitialState } = useModel('@@initialState');
  const { loading, run } = useRequest(login, {
    manual: true,
    onSuccess: (res) => {
      message.success(successMsg);
      Cookies.set('token', res.token)
      history.push('/');
    },
    formatResult: (res) => res,
  });

  // const usernameRequest = useRequest(getCurrentUser, {
  //   ready: !!userIdRequest.data,
  // });

  return (
    <ProForm
      initialValues={{ autoLogin: true }}
      submitter={{
        searchConfig: { submitText: submitBtn },
        render: (_, doms) => doms.pop(), // remove 'cancel' botton
        submitButtonProps: {
          loading: loading,
          size: 'large',
          style: { width: '100%' },
        },
      }}
      onFinish={(values: loginParams) => run(values)}
    >
      {/* <Alert className="m-b:2" message={errorMsg} type="error" showIcon /> */}
      <ProFormText
        name="username"
        fieldProps={{
          size: 'large',
          prefix: <SmileTwoTone />,
        }}
        placeholder={usernamePhd}
        rules={usernameRule}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockTwoTone />,
        }}
        placeholder={PasswordPhd}
        rules={passwordRule}
      />
      <ProFormCheckbox noStyle name="autoLogin">
        {rememberMeTex}
      </ProFormCheckbox>
      <Divider />
      {/* <a style={{ float: 'right' }}>
          <FormattedMessage id="pages.login.forgotPassword"/>
        </a> */}
    </ProForm>
  );
};

const Login: React.FC<{}> = () => {
  return (
    <Col span={8} offset={8}>
      <Space direction="vertical" className={'w:full'}>
        <Title> YIMU </Title>
        <LoginForm />
        <Space>
          <FormattedMessage id="pages.login.loginWith.tex" />
          <WechatOutlined className={'icon'} />
        </Space>
      </Space>
    </Col>
  );
};

export default Login;
