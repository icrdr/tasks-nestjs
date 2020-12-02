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
    icon: 'dashboard',
    component: 'dashboard/dashboard.page',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'smile',
    routes: [
      {
        path: '/admin/task',
        name: 'taskManagement',
        component: 'task/task.page',
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
