import React from 'react';
import { BasicLayoutProps, PageLoading } from '@ant-design/pro-layout';
import { RequestConfig } from 'umi';
import { getMe, initialState } from '@/pages/layout/layout.service';
import Footer from '@/pages/layout/components/Footer';
import RightContent from '@/pages/layout/components/RightContent';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';
import { history } from 'umi';
import { me } from '@/dtos/user.dto';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  let me: me | undefined = undefined;
  const token = Cookies.get('token');

  if (token) {
    try {
      const payload = jwt.verify(token, 'secret');
      me = await getMe();
    } catch {
      history.push('/login');
    }
  }
  return { me };
}

export const layout = (): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
    disableContentMargin: false,
    menuHeaderRender: undefined,
    primaryColor: '#1890ff',
    layout: 'mix',
    contentWidth: 'Fluid',
    fixedHeader: false,
    fixSiderbar: true,
    colorWeak: false,
    title: 'Ant Design Pro',
    siderWidth: 208,
  };
};

export const request: RequestConfig = {
  errorConfig: {
    adaptor: (resData) => {
      return {
        data: resData,
        success: resData.statusCode,
        errorMessage: resData.message || undefined,
      };
    },
  },
  middlewares: [
    async function setAuthorization(ctx, next) {
      const token = Cookies.get('token');
      if (token) {
        ctx.req.options.headers = {
          ...ctx.req.options.headers,
          authorization: `Bearer ${token}`,
        };
      }
      await next();
    },
  ],
  credentials: 'include',
};
