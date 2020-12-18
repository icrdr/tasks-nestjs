import React from "react";
import { BasicLayoutProps, PageLoading } from "@ant-design/pro-layout";
import { RequestConfig } from "umi";
import {
  getCurrentUser,
  initialState,
  currentUser,
} from "./pages/layout/layout.service";
import Footer from "./pages/layout/components/layout.Footer";
import RightContent from "./pages/layout/components/layout.RightContent";
import Cookies from "js-cookie";
import jwt from "jsonwebtoken";
import { history } from "umi";
import { tokenPayload } from "@/modules/user/user.interface";
import OSS from "ali-oss";
import config from "../config";

export const initialStateConfig = {
  loading: <PageLoading />,
};

export async function getInitialState(): Promise<initialState> {
  //@ts-ignore
  let currentUser: currentUser | undefined = undefined;
  let ossClient: OSS | undefined = undefined;
  console.log(config)
  try {
    ossClient = new OSS({
      region: config.ossRegion,
      accessKeyId: config.ossAccessKeyId,
      accessKeySecret: config.ossAccessKeySecret,
      bucket: config.ossBucket,
    });
    console.log(ossClient);
  } catch (e) {
    console.log(e);
  }

  const token = Cookies.get("token");
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as tokenPayload;
      currentUser = await getCurrentUser();
      currentUser.perms = payload.perms;
    } catch {
      history.push("/login");
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
      const token = Cookies.get("token");
      if (token) {
        ctx.req.options.headers = {
          ...ctx.req.options.headers,
          authorization: `Bearer ${token}`,
        };
      }
      await next();
    },
  ],
  credentials: "include",
};
