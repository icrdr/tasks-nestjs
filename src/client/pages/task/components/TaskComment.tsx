import React, { useRef, useState } from 'react';
import { Comment, Button, Card, Form, Input, List, Mentions, Avatar, Popover, Space } from 'antd';
import Cookies from 'js-cookie';
import { CommentDTO, CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
import { useModel, useRequest } from 'umi';
import { getSpaceMembers } from '../../member/member.service';
import { MemberRes } from '@dtos/space.dto';
import { FileImageOutlined, MessageOutlined, SmileOutlined } from '@ant-design/icons';
import moment from 'moment';
import { Picker } from 'emoji-mart';

// import { CommentType } from '@server/task/entities/comment.entity';

const TaskComment: React.FC<{
  taskId: number;
}> = ({ taskId }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const commentListEle = useRef(null);
  const [form] = Form.useForm();
  const [commentList, setCommentList] = useState<CommentRes[]>([
    // {
    //   sender: { id: 12, username: 'users' },
    //   content: 'asdfasdfasdfasdf',
    //   type: CommentType.TEXT,
    //   createAt: new Date(),
    // },
  ]);
  const commentListRef = useRef([]);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  commentListRef.current = commentList;

  const {
    readyState,
    sendMessage,
    latestMessage,
    disconnect,
    connect,
    webSocketIns,
  } = useWebSocket(`ws://localhost:3000?target=discuss&taskId=${taskId}`, {
    reconnectInterval: 1000,
    protocols: Cookies.get('token'),
    onMessage: (message: WebSocketEventMap['message']) => {
      const data = JSON.parse(message.data);
      console.log(data);
      setCommentList([...commentListRef.current, data]);
      // console.log(commentListRef.current);
      handleScrollDown();
    },
  });

  const handleScrollDown = () => {
    if (
      commentListEle.current.scrollTop + 200 >
      commentListEle.current.scrollHeight - commentListEle.current.clientHeight
    )
      commentListEle.current.scrollTop = commentListEle.current.scrollHeight;
  };

  const getMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      setMemberList(res.list);
    },
  });

  const handleSend = (values) => {
    console.log(values);
    const data = {
      taskId: taskId,
      content: values.content,
      type: 'text',
    };

    const sendData = JSON.stringify({ event: 'comment', data });
    sendMessage(sendData);
    form.resetFields();
    commentListEle.current.scrollTop = commentListEle.current.scrollHeight;
  };

  return (
    <div style={{ height: '100%', minWidth: '100px', position: 'relative' }}>
      <Card
        bordered={false}
        style={{ height: 'calc(100vh - 300px)' }}
        bodyStyle={{ height: '100%', padding: 0 }}
      >
        <div
          ref={commentListEle}
          style={{ height: '100%', overflowY: 'scroll', padding: '0 20px' }}
        >
          <List
            dataSource={commentList}
            itemLayout="horizontal"
            renderItem={(comment) => (
              <Comment
                author={comment.sender?.username}
                datetime={moment(comment.createAt).fromNow()}
                avatar={<Avatar>{comment.sender?.username}</Avatar>}
                content={comment.content}
              />
            )}
          />
        </div>
      </Card>
      <Form form={form} onFinish={handleSend}>
        <div style={{ padding: '10px 0', width: '100%' }}>
          <Space>
            <Button icon={<FileImageOutlined />} />
            <Popover trigger={'click'} content={<Picker set="apple" />}>
              <Button icon={<SmileOutlined />} />
            </Popover>
          </Space>
          <Button
            icon={<MessageOutlined />}
            style={{ float: 'right' }}
            type="primary"
            htmlType="submit"
          >
            发送
          </Button>
        </div>
        <Form.Item name="content">
          <Mentions
            style={{ width: '100%' }}
            loading={getMembersReq.loading}
            autoSize={{ minRows: 4, maxRows: 8 }}
            onSearch={(text) => {
              console.log(text);
              getMembersReq.run(currentSpace.id, { username: text });
            }}
          >
            {memberList.map((member) => (
              <Mentions.Option key={member.userId.toString()} value={member.username}>
                <span>{member.username}</span>
              </Mentions.Option>
            ))}
          </Mentions>
        </Form.Item>
      </Form>
    </div>
  );
};
export default TaskComment;
