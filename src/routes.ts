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
    routes: [
      {
        path: '/task/:id',
        name: 'detail',
        component: 'taskDetail/taskDetail.page',
        hideInMenu: true,
      },
    ],
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
    routes: [
      {
        path: '/admin/tasklist',
        name: 'task',
        component: 'adminTask/adminTask.page',
      },
      {
        path: '/admin/user',
        name: 'user',
        component: 'adminTask/adminTask.page',
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
    access: 'hasAdmin',
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
