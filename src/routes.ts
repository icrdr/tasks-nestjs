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
    path: '/list',
    name: 'tableList',
    icon: 'table',
    component: 'tableList/tableList.page',
  },
  {
    path: '/task',
    name: 'task',
    icon: 'smile',
    component: 'task/task.page',
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
