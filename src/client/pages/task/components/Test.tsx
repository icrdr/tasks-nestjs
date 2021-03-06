import React, { forwardRef, useEffect, useRef, useState } from "react";
import { Card, Avatar, Space, Typography, Skeleton, Image } from "antd";
import moment from "moment";
import { getOssClient } from "../../layout/layout.service";
import { useMount } from "ahooks";
import { CommentType } from "../../../../server/common/common.entity";

const { Text, Paragraph } = Typography;

const Test: React.FC<{ update? }> = ({ update=false }) => {
  
  useEffect(() => {
    console.log("rebuilding");
  }, [update]);

  return <div>asdfasdf</div>;
};
//@ts-ignore
export default Test;
