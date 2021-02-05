import React from 'react';
import { BasicLayoutProps, PageLoading } from '@ant-design/pro-layout';
import { RequestConfig } from 'umi';
import {
  getCurrentUser,
  initialState,
  getStsToken,
  getSpaces,
  getSpace,
} from './pages/layout/layout.service';
import Footer from './pages/layout/components/layout.Footer';
import RightContent from './pages/layout/components/layout.RightContent';
import SpaceMenu from './pages/layout/components/layout.SpaceMenu';
import Cookies from 'js-cookie';
import { history } from 'umi';
import { SpaceDetailRes } from '../dtos/space.dto';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  //@ts-ignore
  let currentUser: currentUser;
  let currentSpace: SpaceDetailRes;

  const token = Cookies.get('token');
  const space = Cookies.get('space');

  const goLogin = async () => {
    Cookies.remove('token');
    history.push('/login');
  };

  const setSpace = async () => {
    const spaces = await getSpaces();
    console.log(spaces);
    currentSpace = spaces.list[0];
    Cookies.set('space', currentSpace.id.toString());
  };

  if (token) {
    try {
      currentUser = await getCurrentUser();
      console.log(currentUser);
    } catch {
      goLogin();
    }
  }

  if (currentUser) {
    if (space) {
      try {
        currentSpace = await getSpace(parseInt(space));
        console.log(currentSpace);
      } catch {
        setSpace();
      }
    } else {
      setSpace();
    }
  }

  return { currentUser, currentSpace };
}

export const layout = (): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
    menuExtraRender: (props) => <SpaceMenu props={props} />,
    menuHeaderRender: () => false,
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
