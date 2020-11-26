export default [
  {
    path: '/login',
    component: '@/layouts/Base',
    layout: false,
    routes: [{ component: 'login' }],
  },
  {
    path: '/exception',
    layout: false,
    routes: [
      {
        path: '/exception/404',
        component: '404',
      },
    ],
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: 'dashboard',
  },
  {
    path: '/list',
    name: 'tableList',
    icon: 'table',
    component: 'listTableList',
  },
  {
    path: '/task',
    name: 'task',
    icon: 'smile',
    component: 'task',
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    redirect: '/exception/404',
  },
];
