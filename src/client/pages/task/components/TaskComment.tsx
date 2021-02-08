import React, { useRef, useState } from 'react';
import {
  Comment,
  Button,
  Card,
  Form,
  Input,
  List,
  Mentions,
  Avatar,
  Popover,
  Space,
  Alert,
  Typography,
  message,
} from 'antd';
import Cookies from 'js-cookie';
import { CommentDTO, CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
import { useModel, useRequest } from 'umi';
import { getSpaceMembers } from '../../member/member.service';
import { MemberRes } from '@dtos/space.dto';
import {
  FileImageOutlined,
  MessageOutlined,
  PictureOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Picker } from 'emoji-mart';
import { getTaskComments } from '../task.service';
import { CommentType } from '@server/task/entities/comment.entity';
import ReplyMessage from './ReplyMessage';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  InfiniteLoader,
  WindowScroller,
} from 'react-virtualized';
import VList from 'react-virtualized/dist/commonjs/List';
const { Text, Link } = Typography;

const TaskComment: React.FC<{
  taskId: number;
}> = ({ taskId }) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const commentListEle = useRef(null);
  const [form] = Form.useForm();
  // const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const [commentListMap, setCommentListMap] = useState(new Map<number, CommentRes>());
  const [commentCount, setCommentCount] = useState(42);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);

  useRequest(() => getTaskComments(taskId), {
    onSuccess: (res) => {
      // setCommentCount(res.total);
      // handleScrollDown();
    },
  });

  const getCommentsReq = useRequest(getTaskComments, {
    manual: true,
    onSuccess: (res, params) => {
      for (let index = 0; index < params[1].take; index++) {
        commentListMap.set(index + params[1].skip, res.list[index]);
      }
      console.log(commentListMap);
      setCommentListMap(commentListMap);
      // setCommentCount(res.total);
      // handleScrollDown();
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      // console.log(res);
      setMemberList(res.list);
    },
  });

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
    onMessage: (msg: WebSocketEventMap['message']) => {
      const data = JSON.parse(msg.data);
      console.log(data);
      if (!data.status) {
        // setCommentList([...commentListRef.current, data]);
        // handleScrollDown();
      } else {
        message.error(data.message);
      }
    },
  });

  const handleScrollDown = () => {
    if (
      commentListEle.current.scrollTop + 200 >
      commentListEle.current.scrollHeight - commentListEle.current.clientHeight
    )
      commentListEle.current.scrollTop = commentListEle.current.scrollHeight;
  };

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

  const handleEmojiSelete = (emoji) => {
    const preValue = form.getFieldsValue();
    preValue.content = preValue.content ? preValue.content + emoji.native : emoji.native;
    form.setFieldsValue(preValue);
  };
  const contentRule = [
    {
      required: true,
      message: '必填',
    },
  ];

  function isRowLoaded({ index }) {
    return !!commentListMap.get(index);
  }

  function loadMoreRows({ startIndex, stopIndex }) {
    console.log(startIndex);
    console.log(stopIndex);
    return getCommentsReq.run(taskId, { skip: startIndex, take: stopIndex - startIndex });
  }
  const cache = new CellMeasurerCache({
    defaultHeight: 100,
    minHeight: 70,
    fixedWidth: true,
  });

  function rowRenderer({ key, index, style, parent }) {
    const comment = commentListMap.get(index);
    return (
      <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        <ReplyMessage
          style={style}
          type={comment?.type}
          isMe={comment?.sender?.id === currentUser.id}
          author={comment?.sender?.username}
          datetime={comment?.createAt}
          avatar={comment?.sender?.username}
          content={comment?.content}
        />
      </CellMeasurer>
    );
  }

  // const infiniteLoader = (
  //   <WindowScroller>
  //     {({ height, isScrolling, onChildScroll, scrollTop }) => (
  //       <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={loadMoreRows} rowCount={10}>
  //         {({ onRowsRendered }) => (
  //           <VList
  //             autoHeight
  //             height={height}
  //             width={300}
  //             rowCount={10}
  //             rowHeight={20}
  //             rowRenderer={rowRenderer}
  //             onRowsRendered={onRowsRendered}
  //             isScrolling={isScrolling}
  //             onScroll={onChildScroll}
  //             scrollTop={scrollTop}
  //           />
  //         )}
  //       </InfiniteLoader>
  //     )}
  //   </WindowScroller>
  // );

  const infiniteLoader = (
    <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={loadMoreRows} rowCount={commentCount}>
      {({ onRowsRendered, registerChild }) => (
        <AutoSizer disableHeight>
          {({ width }) => (
            <VList
              ref={registerChild}
              height={600}
              width={width}
              rowCount={commentCount}
              rowHeight={70}
              rowRenderer={rowRenderer}
              onRowsRendered={onRowsRendered}
            />
          )}
        </AutoSizer>
      )}
    </InfiniteLoader>
  );

  return (
    <div style={{ height: '100%', minWidth: '250px', position: 'relative' }}>
      <Card
        bordered={false}
        style={{ height: 'calc(100vh - 300px)' }}
        bodyStyle={{ height: '100%', padding: 0 }}
      >
        {infiniteLoader}
        {/* <div
          ref={commentListEle}
          style={{ height: '100%', overflowY: 'scroll', padding: '10px 20px' }}
        >
          <List
            dataSource={commentList}
            itemLayout="horizontal"
            renderItem={(comment) => (
              <ReplyMessage
                type={comment.type}
                isMe={comment.sender?.id === currentUser.id}
                author={comment.sender?.username}
                datetime={comment.createAt}
                avatar={comment.sender?.username}
                content={comment.content}
              />
            )}
          />
        </div> */}
      </Card>
      <Form form={form} onFinish={handleSend}>
        <div style={{ padding: '10px 0', width: '100%' }}>
          <Space>
            <Popover trigger={'click'} content={'upload'}>
              <Button icon={<PictureOutlined />} />
            </Popover>
            <Popover
              trigger={'click'}
              content={
                <Picker
                  set="apple"
                  showPreview={false}
                  showSkinTones={false}
                  onSelect={(emoji) => handleEmojiSelete(emoji)}
                />
              }
            >
              <Button icon={<SmileOutlined />} />
            </Popover>
          </Space>
          <Button style={{ float: 'right' }} type="primary" htmlType="submit">
            发送
          </Button>
        </div>
        <Form.Item name="content" rules={contentRule}>
          <Mentions
            style={{ width: '100%' }}
            loading={getSpaceMembersReq.loading}
            autoSize={{ minRows: 4, maxRows: 8 }}
            onSearch={(text) => {
              console.log('text');
              getSpaceMembersReq.run(currentSpace.id, { username: text });
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
