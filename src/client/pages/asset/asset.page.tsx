import React from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { Card, Alert, Typography } from "antd";
import { Access, useAccess, useRequest } from "umi";
import AssetGallery from "../task/components/AssetGallery";

const Resource: React.FC<{}> = () => {
  return (
    <div style={{ padding: 20 }}>
      <AssetGallery />
    </div>
  );
};
export default Resource;
