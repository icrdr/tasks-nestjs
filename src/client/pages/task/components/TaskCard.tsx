import React from "react";
import { Card, Typography } from "antd";

import { FileOutlined } from "@ant-design/icons";
import { OutputData } from "@editorjs/editorjs";

const { Text, Paragraph, Title } = Typography;

const TaskCard: React.FC<{
  onTapCover?: Function;
  content: OutputData;
  name: string;
  cover?: string;
}> = ({ onTapCover = () => {}, content, name, cover }) => {
  return (
    <Card
      cover={
        <div
          onClick={() => onTapCover()}
          className="task-card"
          style={{
            backgroundImage: `url(${cover})`,
            overflow: "hidden",
          }}
        >
          {!cover && (
            <div className="task-card-content">
              {content?.blocks
                .filter((b) => b.type === "paragraph" || b.type === "header")
                .map((b, i) => {
                  switch (b.type) {
                    case "paragraph":
                      return (
                        <Paragraph key={i} type="secondary">
                          {b.data.text}
                        </Paragraph>
                      );
                    case "header":
                      return (
                        <Title key={i} type="secondary">
                          {b.data.text}
                        </Title>
                      );
                    default:
                      return false;
                  }
                })}
            </div>
          )}
        </div>
      }
    >
      {name}
    </Card>
  );
};
export default TaskCard;
