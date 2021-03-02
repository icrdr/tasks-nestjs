export default [
  {
    path: "/login",
    component: "layout/base.layout",
    layout: false,
    routes: [{ component: "login/login.page" }],
  },
  {
    path: "/setting",
    name: "setting",
    icon: "SettingOutlined",
    component: "setting/setting.page",
  },
  {
    path: "/member",
    name: "member",
    icon: "UserOutlined",
    component: "member/member.page",
  },
  {
    path: "/task",
    name: "task",
    icon: "ContainerOutlined",
    component: "task/task.page",
  },
  {
    path: "/task/:id",
    name: "task.detail",
    component: "task/taskDetail.page",
    hideInMenu: true,
    parentKeys: ["/task"],
    routes: [
      { path: "/task/:id/content", component: "task/taskContent.page" },
      { path: "/task/:id/asset", component: "task/taskAsset.page" },
    ],
  },
  {
    path: "/asset",
    name: "asset",
    icon: "PictureOutlined",
    component: "asset/asset.page",
  },
  {
    path: "/exception",
    layout: false,
    routes: [
      {
        path: "/exception/404",
        component: "exception/404",
      },
    ],
  },
  {
    path: "/",
    redirect: "/task",
  },
  {
    redirect: "/exception/404",
  },
];
