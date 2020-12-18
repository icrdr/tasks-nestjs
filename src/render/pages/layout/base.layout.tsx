import React from 'react';
import { SelectLang } from 'umi';
import { Layout, Affix } from 'antd';
import Footer from './components/layout.Footer';

const Base: React.FC<{}> = ({ children }) => {
  return (
    <Layout className={'container'}>
      <Affix>
        <SelectLang />
      </Affix>
      <Layout.Content>{children}</Layout.Content>
      <Footer />
    </Layout>
  );
};

export default Base;
