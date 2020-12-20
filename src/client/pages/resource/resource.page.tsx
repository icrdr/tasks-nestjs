import React from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { Card, Alert, Typography } from "antd";
import { Access, useAccess, useRequest } from "umi";
import EEE from "@components/EEE";

const Resource: React.FC<{}> = () => {
  return (
    <PageContainer>
      <EEE></EEE>
    </PageContainer>
  );
};
export default Resource;
