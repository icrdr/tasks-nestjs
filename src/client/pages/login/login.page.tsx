import React from "react";
import {
  useIntl,
  useHistory,
  FormattedMessage,
  useRequest,
  useModel,
} from "umi";
import {
  Space,
  message,
  Typography,
  Col,
  Divider,
  Form,
  Button,
  Input,
  Checkbox,
} from "antd";
import { LockTwoTone, SmileTwoTone, WechatOutlined } from "@ant-design/icons";
import { login } from "./login.service";
import Cookies from "js-cookie";
import OSS from "ali-oss";
import { SpaceDetailRes } from "@dtos/space.dto";
import { CurrentUserRes } from "../../../dtos/user.dto";
import { getSpace } from "../layout/layout.service";

const { Title } = Typography;

const LoginForm: React.FC = () => {
  const intl = useIntl();
  const history = useHistory();
  const { initialState, setInitialState } = useModel("@@initialState");
  const loginReq = useRequest(login, {
    manual: true,
    onSuccess: async (res) => {
      console.log(res);
      Cookies.set("token", res.token);
      let currentUser: CurrentUserRes;
      let currentSpace: SpaceDetailRes;

      currentUser = res.currentUser as CurrentUserRes;
      const currentSpaceId = parseInt(localStorage.getItem("currentSpaceId"));

      if (currentUser.spaces.length > 0) {
        const spaceId =
          currentUser.spaces.map((space) => space.id).indexOf(currentSpaceId) >=
          0
            ? currentSpaceId
            : currentUser.spaces[0].id;
        
        currentSpace = (await getSpace(spaceId)) as SpaceDetailRes;
        localStorage.setItem("currentSpaceId", currentSpace.id.toString());
      } else {
        localStorage.removeItem("currentSpaceId");
      }

      setInitialState({ ...initialState, currentUser, currentSpace });

      message.success(successMsg);
      history.push("/me");
    },
  });

  const successMsg = intl.formatMessage({
    id: "page.login.success.msg",
  });

  return (
    <Form
      layout="vertical"
      name="basic"
      initialValues={{ remember: true }}
      onFinish={(values) => {
        loginReq.run(values);
      }}
    >
      <Form.Item
        label="用户名或邮箱"
        name="username"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: "Please input your password!" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item name="记住我" valuePropName="checked">
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

const Login: React.FC<{}> = () => {
  return (
    <Col span={8} offset={8}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title> YIMU </Title>
        <LoginForm />
        <Space>
          <FormattedMessage id="page.login.loginWith.tex" />
        </Space>
      </Space>
    </Col>
  );
};

export default Login;
