import React from 'react';
import { BasicLayoutProps, PageLoading } from '@ant-design/pro-layout';
import { RequestConfig } from 'umi';
import { getCurrentUser, initialState, currentUser } from '@/pages/layout/layout.service';
import Footer from '@/pages/layout/components/layout.Footer';
import RightContent from '@/pages/layout/components/layout.RightContent';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';
import { history } from 'umi';
import { tokenPayload } from './modules/user/user.interface';
import OSS from 'ali-oss';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  let currentUser: currentUser | undefined = undefined;
  let ossClient: OSS | undefined = undefined;

  try {
    ossClient = new OSS({
      region: 'oss-cn-hangzhou',
      accessKeyId: 'LTAI4G31Yoh3TMXHv9QZQ45k',
      accessKeySecret: 'sFfIKhMst9Pm7A8t39QfpQfEsvf55K',
      bucket: 'yimu-tasks',
    });
    console.log(ossClient);
  } catch (e) {
    console.log(e);
  }

  const token = Cookies.get('token');
  if (token) {
    try {
      const payload = jwt.verify(token, 'secret') as tokenPayload;
      currentUser = await getCurrentUser();
      currentUser.perms = payload.perms;
    } catch {
      history.push('/login');
    }
  }
  return { currentUser, ossClient };
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
