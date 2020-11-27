import React from 'react';
import { BasicLayoutProps, PageLoading } from '@ant-design/pro-layout';
import { RequestConfig } from 'umi';
import { getCurrentUser, initialState } from '@/pages/layout/layout.service';
import Footer from '@/pages/layout/components/Footer';
import RightContent from '@/pages/layout/components/RightContent';
import Cookies from 'js-cookie';
import { tokenPayload } from '@/modules/user/user.interface';
import jwt from 'jsonwebtoken';
import { history } from 'umi';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  let currentUser: any = undefined;
  // try {
  //   const token = Cookies.get('token');
  //   const payload = jwt.verify(token, 'secret') as tokenPayload;
  //   currentUser = await getCurrentUser();
  //   currentUser['perms'] = payload.perms;
  // } catch {}

  return { currentUser };
}

export const layout = (): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
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
