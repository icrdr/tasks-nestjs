export default [
  {
    path: '/login',
    component: 'layout/base.layout',
    layout: false,
    routes: [{ component: 'login/login.page' }],
  },
  {
    path: '/member',
    name: 'member',
    icon: 'UserOutlined',
    component: 'adminUser/adminUser.page',
  },
  {
    path: '/task',
    name: 'task',
    icon: 'ContainerOutlined',
    component: 'adminTask/adminTask.page',
  },
  {
    path: '/task/:id',
    name: 'task.detail',
    component: 'adminTask/adminTaskDetail.page',
    hideInMenu: true,
    parentKeys: ['/task'],
  },
  {
    path: '/asset',
    name: 'asset',
    icon: 'PictureOutlined',
    component: 'asset/asset.page',
  },
  {
    path: '/exception',
    layout: false,
    routes: [
      {
        path: '/exception/404',
        component: 'exception/404',
      },
    ],
  },
  {
    path: '/',
    redirect: '/task',
  },
  {
    redirect: '/exception/404',
  },
];
