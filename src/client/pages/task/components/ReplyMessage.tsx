import React from 'react';
import { Card, Avatar, Space, Typography } from 'antd';
import moment from 'moment';
import { CommentType } from '@server/task/entities/comment.entity';

const { Text } = Typography;

const ReplyMessage: React.FC<{
  type?: CommentType;
  author?: string;
  datetime?: Date;
  isMe?: boolean;
  avatar?: string;
  content?: string;
  style?: React.CSSProperties;
}> = ({
  // type = CommentType.TEXT,
  author = 'user',
  datetime = new Date(),
  content = '',
  avatar = '',
  isMe = false,
  style,
}) => {
  return (
    <div style={{ ...style, height: '200px', marginBottom: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          alignItems: 'flex-start',
        }}
      >
        <Avatar
          src={avatar}
          style={{ order: isMe ? 2 : 0, flexShrink: 0, marginRight: isMe ? 0 : '8px' }}
        >
          {author}
        </Avatar>
        <div
          style={{
            order: isMe ? 0 : 3,
            flexShrink: 0,
            width: '32px',
            marginRight: isMe ? '8px' : 0,
          }}
        />
        <div style={{ order: 1, flexGrow: 1, marginRight: '8px' }}>
          <div
            style={{
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              display: 'flex',
            }}
          >
            <Card
              className={isMe ? 'chat-message-card-me' : 'chat-message-card-other'}
              style={{ width: 'auto', maxWidth: '400px' }}
              bodyStyle={{ padding: '10px' }}
            >
              <Space direction="vertical" size={0} align={isMe ? 'end' : 'start'}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {moment(datetime).fromNow()}
                </Text>
                <Text>{content}</Text>
              </Space>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReplyMessage;
