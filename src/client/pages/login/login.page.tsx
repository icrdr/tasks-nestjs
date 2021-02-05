import React from 'react';
import { useIntl, history, FormattedMessage, useRequest, useModel } from 'umi';
import { Space, message, Typography, Col, Divider, Button } from 'antd';
import { LockTwoTone, SmileTwoTone, WechatOutlined } from '@ant-design/icons';
import ProForm, { ProFormCheckbox, ProFormText } from '@ant-design/pro-form';
import { login } from './login.service';
import Cookies from 'js-cookie';
import OSS from 'ali-oss';
const { Title } = Typography;

const LoginForm: React.FC = () => {
  const intl = useIntl();

  const { initialState, setInitialState } = useModel('@@initialState');
  const loginReq = useRequest(login, {
    manual: true,
    onSuccess: (res) => {
      try {
        console.log(res);
        const currentUser = res.currentUser;
        const currentSpace = res.personalSpace
        setInitialState({ ...initialState, currentUser, currentSpace });
        Cookies.set('token', res.token);
        Cookies.set('space', currentSpace.id.toString());
        message.success(successMsg);
        history.push('/');
      } catch {}
    },
  });

  const successMsg = intl.formatMessage({
    id: 'page.login.success.msg',
  });

  const submitBtn = intl.formatMessage({
    id: 'page.login.submit.btn',
  });

  const errorMsg = intl.formatMessage({
    id: 'page.login.error.msg',
  });

  const usernamePhd = intl.formatMessage({
    id: 'page.login.username.phd',
  });

  const PasswordPhd = intl.formatMessage({
    id: 'page.login.password.phd',
  });

  const rememberMe = intl.formatMessage({
    id: 'page.login.rememberMe',
  });

  const passwordRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'page.login.username.required',
      }),
    },
  ];

  const usernameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'page.login.password.required',
      }),
    },
  ];

  return (
    <ProForm
      initialValues={{ autoLogin: true }}
      submitter={{
        searchConfig: { submitText: submitBtn },
        render: (_, doms) => doms.pop(), // remove 'cancel' botton
        submitButtonProps: {
          loading: loginReq.loading,
          size: 'large',
          style: { width: '100%' },
        },
      }}
      onFinish={async (values) => {
        loginReq.run(values);
      }}
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
        {rememberMe}
      </ProFormCheckbox>
      <Divider />
      {/* <a style={{ float: 'right' }}>
          <FormattedMessage id="page.login.forgotPassword"/>
        </a> */}
    </ProForm>
  );
};

const Login: React.FC<{}> = () => {
  return (
    <Col span={8} offset={8}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title> YIMU </Title>
        <LoginForm />
        <Space>
          <FormattedMessage id="page.login.loginWith.tex" />
          <WechatOutlined className={'icon'} />
        </Space>
      </Space>
    </Col>
  );
};

export default Login;
