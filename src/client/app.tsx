import React from 'react';
import { BasicLayoutProps, PageLoading } from '@ant-design/pro-layout';
import { RequestConfig } from 'umi';
import { getCurrentUser, initialState, getStsToken } from './pages/layout/layout.service';
import Footer from './pages/layout/components/layout.Footer';
import RightContent from './pages/layout/components/layout.RightContent';
import MenuHeader from './pages/layout/components/layout.MenuHeader';
import Cookies from 'js-cookie';
import { history } from 'umi';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  //@ts-ignore
  let currentUser: currentUser | undefined = undefined;

  const token = Cookies.get('token');
  if (token) {
    try {
      currentUser = await getCurrentUser();
      console.log(currentUser);
    } catch {
      history.push('/login');
    }
  }

  return { currentUser };
}

export const layout = (): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
    menuHeaderRender: () => <MenuHeader />,
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
