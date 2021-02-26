import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { Access, useAccess, useRequest } from 'umi';
import AssetGallery from '../task/components/AssetGallery';

const Resource: React.FC<{}> = () => {
  return (
    <PageContainer content="管理所有资源">
      <AssetGallery />
    </PageContainer>
  );
};
export default Resource;
