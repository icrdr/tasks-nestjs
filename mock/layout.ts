import { Request, Response } from 'express';

const getCurrentUser = (req: Request, res: Response) => {
  res.send({
    name: 'Serati Ma',
    avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: '00000001',
    email: 'antdesign@alipay.com',
    signature: '海纳百川，有容乃大',
    title: '交互专家',
    group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
    notifyCount: 12,
    unreadCount: 11,
    country: 'China',
    access: true,
    geographic: {
      province: {
        label: '浙江省',
        key: '330000',
      },
      city: {
        label: '杭州市',
        key: '330100',
      },
    },
    address: '西湖区工专路 77 号',
    phone: '0752-268888888',
  });
};

const logout = (req: Request, res: Response) => {
  res.send({ data: {}, success: true });
};

const createUser = (req: Request, res: Response) => {
  res.send({ status: 'ok', currentAuthority: 'user', success: true });
};

const getUsers = async (req: Request, res: Response) => {
  res.send([
    {
      key: '1',
      name: 'John Brown',
      age: 32,
      address: 'New York No. 1 Lake Park',
    },
    {
      key: '2',
      name: 'Jim Green',
      age: 42,
      address: 'London No. 1 Lake Park',
    },
    {
      key: '3',
      name: 'Joe Black',
      age: 32,
      address: 'Sidney No. 1 Lake Park',
    },
  ]);
};

export default {
  'GET /api/currentUser': getCurrentUser,
  'GET /api/users': getUsers,
  'GET /api/logout': logout,
  'POST /api/users': createUser,
};
