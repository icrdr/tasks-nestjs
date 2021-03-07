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
import {
  LockOutlined,
  LockTwoTone,
  SmileTwoTone,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { login } from "./auth.service";
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
      onFinish={(values) => {
        loginReq.run(values);
      }}
    >
      <Form.Item
        label="用户名或邮箱"
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>
      <Form.Item>
        <Space direction={"vertical"} style={{ width: "100%" }}>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
          <span>
            或者 <a href="/signup">注册</a>
          </span>
        </Space>
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
      </Space>
    </Col>
  );
};

export default Login;
