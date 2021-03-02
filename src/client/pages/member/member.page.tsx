import React, { useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { Card, Alert, Typography, Tabs, Radio, Space } from "antd";
import { history, useAccess, useRequest } from "umi";
import AssetGallery from "../task/components/AssetGallery";
import MemberTable from "./components/MemberTable";
import GroupTable from "./components/GroupTable";

const Member: React.FC<{}> = (props) => {
  const [tab, setTab] = useState("member");

  const handleTabChange = (e) => {
    setTab(e.target.value);
  };

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: "100%" }}>
        <div>
          <Radio.Group
            value={tab}
            buttonStyle="solid"
            onChange={handleTabChange}
          >
            <Radio.Button value="member">成员</Radio.Button>
            <Radio.Button value="group">小组</Radio.Button>
          </Radio.Group>
        </div>
        {tab === "member" ? <MemberTable /> : <GroupTable />}
      </Space>
    </div>
  );
};
export default Member;
