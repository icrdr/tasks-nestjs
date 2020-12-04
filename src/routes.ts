export default [
  {
    path: '/login',
    component: 'layout/base.layout',
    layout: false,
    routes: [{ component: 'login/login.page' }],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'Dashboard',
    component: 'dashboard/dashboard.page',
  },
  {
    path: '/task',
    name: 'task',
    icon: 'CheckSquareOutlined',
    component: 'task/task.page',
  },
  {
    path: '/task/:id',
    name: 'task.detail',
    component: 'task/taskDetail.page',
    hideInMenu: true,
    parentKeys: ['/task'],
  },
  {
    path: '/resource',
    name: 'resource',
    icon: 'PictureOutlined',
    component: 'resource/resource.page',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'FolderOpenOutlined',
    access: 'hasAdmin',
    routes: [
      {
        path: '/admin/task',
        name: 'task',
        component: 'adminTask/adminTask.page',
      },
      {
        path: '/admin/task/:id',
        name: 'task.detail',
        component: 'adminTask/adminTaskDetail.page',
        hideInMenu: true,
        parentKeys: ['/admin/task'],
      },
      {
        path: '/admin/user',
        name: 'user',
        component: 'adminUser/adminUser.page',
      },
      {
        path: '/admin/group',
        name: 'group',
        component: 'adminTask/adminTask.page',
      },
      {
        path: '/admin/perm',
        name: 'perm',
        component: 'adminTask/adminTask.page',
      },
      {
        path: '/admin/finance',
        name: 'finance',
        component: 'adminTask/adminTask.page',
      },
    ],
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
    redirect: '/dashboard',
  },
  {
    redirect: '/exception/404',
  },
];
