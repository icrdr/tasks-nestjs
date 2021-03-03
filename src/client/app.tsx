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
import { SpaceDetailRes } from '@dtos/space.dto';
import { CurrentUserRes } from '../dtos/user.dto';

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  //@ts-ignore
  let currentUser: CurrentUserRes;
  let currentSpace: SpaceDetailRes;

  const token = Cookies.get('token');

  if (token) {
    try {
      currentUser = (await getCurrentUser()) as CurrentUserRes;
      console.log(currentUser);
      const currentSpaceId = parseInt(localStorage.getItem('currentSpaceId'));
      if (currentUser.spaces.length > 0) {
        // check currentSpaceId is right

        const spaceId =
          currentUser.spaces.map((space) => space.id).indexOf(currentSpaceId) >= 0
            ? currentSpaceId
            : currentUser.spaces[0].id;

        currentSpace = (await getSpace(spaceId)) as SpaceDetailRes;
        localStorage.setItem('currentSpaceId', currentSpace.id.toString());
      } else {
        localStorage.removeItem('currentSpaceId');
      }
    } catch {
      Cookies.remove('token');
      if (location.pathname !== '/login') history.push('/login');
    }
  }

  return { currentUser, currentSpace };
}

export const layout = (): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    headerRender: false,
    footerRender: () => <Footer />,
    menuExtraRender: (props) => <SpaceMenu props={props} />,
    menuHeaderRender: false,
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
