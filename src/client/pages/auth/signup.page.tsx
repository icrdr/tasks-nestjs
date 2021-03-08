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
  Tooltip,
  Select,
} from "antd";
import {
  LockTwoTone,
  QuestionCircleOutlined,
  SmileTwoTone,
  WechatOutlined,
} from "@ant-design/icons";
import { login } from "./auth.service";
import Cookies from "js-cookie";
import OSS from "ali-oss";
import { SpaceDetailRes } from "@dtos/space.dto";
import { CurrentUserRes } from "../../../dtos/user.dto";
import { getSpace } from "../layout/layout.service";
import { getUsers } from "../task/task.service";

const { Title } = Typography;

const SignUpForm: React.FC = () => {
  const history = useHistory();
  const { initialState, setInitialState } = useModel("@@initialState");
  // const signupReq = useRequest(signup, {
  //   manual: true,
  //   onSuccess: async (res) => {
  //     console.log(res);
  //     Cookies.set("token", res.token);
  //     let currentUser: CurrentUserRes;
  //     let currentSpace: SpaceDetailRes;

  //     currentUser = res.currentUser as CurrentUserRes;
  //     const currentSpaceId = parseInt(localStorage.getItem("currentSpaceId"));

  //     if (currentUser.spaces.length > 0) {
  //       const spaceId =
  //         currentUser.spaces.map((space) => space.id).indexOf(currentSpaceId) >=
  //         0
  //           ? currentSpaceId
  //           : currentUser.spaces[0].id;

  //       currentSpace = (await getSpace(spaceId)) as SpaceDetailRes;
  //       localStorage.setItem("currentSpaceId", currentSpace.id.toString());
  //     } else {
  //       localStorage.removeItem("currentSpaceId");
  //     }

  //     setInitialState({ ...initialState, currentUser, currentSpace });

  //     message.success("注册成功！");
  //     history.push("/me");
  //   },
  // });

  const getUsersReq = useRequest(getUsers, {
    debounceInterval: 500,
    manual: true,
    // onSuccess: (res) => {
    //   console.log(res);

    //   const userOptions = res.list.map((user) => {
    //     return {
    //       label: user.username,
    //       value: user.id,
    //     };
    //   });
    //   setUserOptions(userOptions);
    // },
  });

  const prefixSelector = (
    <Form.Item name="prefix" noStyle>
      <Select style={{ width: 70 }}>
        <Select.Option value="86">+86</Select.Option>
        <Select.Option value="87">+87</Select.Option>
      </Select>
    </Form.Item>
  );
  
  return (
    <Form name="register" onFinish={(v) => console.log(v)} scrollToFirstError>
      <Form.Item
        label="用户名"
        name="username"
        rules={[
          { required: true, message: "Please input your Username!" },
          // {
          //   validator: async (_, v) => {
          //     const res = await getUsers({ username: v });
          //     console.log(res)
          //     res.list.length === 0
          //       ? Promise.resolve()
          //       : Promise.reject(new Error("Should accept agreement"));
          //   },
          // },
        ]}
      >
        <Input
          placeholder="Username"
          onChange={(e) => getUsersReq.run({ username: e.currentTarget.value })}
        />
      </Form.Item>
      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          {
            type: "email",
            message: "The input is not valid E-mail!",
          },
          {
            required: true,
            message: "Please input your E-mail!",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirm"
        label="确认密码"
        dependencies={["password"]}
        hasFeedback
        rules={[
          {
            required: true,
            message: "Please confirm your password!",
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(
                new Error("The two passwords that you entered do not match!")
              );
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="nickname"
        label="昵称"
        rules={[
          {
            required: true,
            message: "Please input your nickname!",
            whitespace: true,
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label="手机号"
        rules={[{ required: true, message: "Please input your phone number!" }]}
      >
        <Input addonBefore={prefixSelector} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="agreement"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value
                ? Promise.resolve()
                : Promise.reject(new Error("Should accept agreement")),
          },
        ]}
      >
        <Checkbox>
          我已经阅读 <a href="">同意事项</a>
        </Checkbox>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};

const SignUp: React.FC<{}> = () => {
  return (
    <Col span={8} offset={8}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <SignUpForm />
      </Space>
    </Col>
  );
};

export default SignUp;
