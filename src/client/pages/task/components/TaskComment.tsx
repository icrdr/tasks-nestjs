import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Button, Card, Form, Mentions, Popover, Space, message, Upload, Image } from 'antd';
import Cookies from 'js-cookie';
import { CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
import { useModel, useRequest } from 'umi';
import { getSpaceMembers } from '../../member/member.service';
import { MemberRes } from '@dtos/space.dto';
import {
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  PlusOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Picker } from 'emoji-mart';
import { getTaskComments } from '../task.service';
import ReplyMessage from './ReplyMessage';
import { AutoSizer, CellMeasurer, CellMeasurerCache, InfiniteLoader } from 'react-virtualized';
import VList from 'react-virtualized/dist/commonjs/List';
import { useInterval } from 'ahooks';
import { getBase64, sleep } from '@utils/utils';
import moment from 'moment';
import { getOssClient } from '../../layout/layout.service';
import { RcFile } from 'antd/lib/upload';
import { CommentType } from '../../../../server/task/entities/comment.entity';

const TaskComment = ({ taskId }, ref) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const commentListEle = useRef(null);
  const vListRef = useRef<VList>(null);
  const [form] = Form.useForm();
  const [commentListMap, setCommentListMap] = useState(new Map<number, CommentRes>());
  const [commentCount, setCommentCount] = useState(0);
  const [isUploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [afterFirstFetch, setAfterFirstFetch] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const [scrollInterval, setScrollInterval] = useState(null);
  const [scrollTargetIndex, setScrollTarget] = useState(0);
  const commentCountRef = useRef<number>();
  const scrollTargetIndexRef = useRef<number>();
  const afterFirstFetchRef = useRef<boolean>();
  commentCountRef.current = commentCount;
  scrollTargetIndexRef.current = scrollTargetIndex;
  afterFirstFetchRef.current = afterFirstFetch;

  // const size = useSize(commentListEle)
  useRequest(() => getTaskComments(taskId), {
    ready: !!taskId,
    onSuccess: (res) => {
      console.log(res);
      setCommentCount(res.total);
      vListRef.current.scrollToPosition(10000000000);
    },
  });

  const recomputeRowHeights = () => {
    cache.clearAll();
    vListRef.current.recomputeRowHeights();
  };

  const scrollToDate = (date: Date) => {
    getTaskComments(taskId, { dateAfter: date }).then((res) => {
      console.log(res.list[0].index);

      sleep(0).then(() => {
        setScrollTarget(res.list[0].index);
        setScrollInterval(200);
      });
    });
  };

  const scrollToBottom = () => {
    sleep(0).then(() => {
      setScrollTarget(commentCountRef.current - 1);
      setScrollInterval(200);
    });
  };

  useInterval(
    () => {
      const list = document.getElementsByClassName('v-list')[0];
      const offset = vListRef.current.getOffsetForRow({
        alignment: 'start',
        index: scrollTargetIndex,
      });

      console.log('current top', list.scrollTop);
      console.log('scroll to', offset);

      if (list.scrollTop + 10 < offset || list.scrollTop - 10 > offset) {
        vListRef.current.scrollToPosition(offset);
      } else {
        setScrollInterval(null);
      }
    },
    scrollInterval,
    { immediate: true },
  );

  useImperativeHandle(ref, () => ({
    recomputeRowHeights,
    scrollToDate,
    scrollToBottom,
  }));

  const getCommentsReq = useRequest(getTaskComments, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      for (const comment of res.list) {
        commentListMap.set(comment.index, comment);
      }
      setCommentListMap(commentListMap);
      setCommentCount(res.total);
      recomputeRowHeights();
      if (res.list[res.list.length - 1].index === res.total - 1) {
        scrollToBottom();
      }
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
        commentListMap.set(commentCountRef.current, data);
        setCommentListMap(commentListMap);
        setCommentCount(commentCountRef.current + 1);
        recomputeRowHeights();
        const isUserSending = data.sender.id === currentUser.id;
        const list = document.getElementsByClassName('v-list')[0];
        const isNearBottom = list.scrollTop + list.clientHeight + 300 < list.scrollHeight;
        if (isUserSending || isNearBottom) {
          scrollToBottom();
        }
      } else {
        message.error(data.message);
      }
    },
  });

  const handleSend = (content: string, type: string) => {
    const data = {
      taskId: taskId,
      content: content,
      type: type,
    };

    const sendData = JSON.stringify({ event: 'comment', data });
    sendMessage(sendData);
    form.resetFields();
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
    //cancel the fetch right after the first bottom fetch.
    if (stopIndex === commentCountRef.current - 1) {
      setAfterFirstFetch(true);
      sleep(1000).then(() => {
        setAfterFirstFetch(false);
      });
    }
    return afterFirstFetchRef.current
      ? Promise.resolve()
      : getCommentsReq.run(taskId, { skip: startIndex, take: stopIndex - startIndex + 1 });
  }
  const cache = new CellMeasurerCache({
    defaultHeight: 126,
    minHeight: 86,
    fixedWidth: true,
  });
  function rowRenderer({ key, index, style, parent }) {
    const comment = commentListMap.get(index);
    return (
      <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        {({ measure, registerChild }) => (
          <div ref={registerChild} style={{ ...style }}>
            <ReplyMessage
              onLoad={measure}
              type={comment?.type}
              isMe={comment?.sender?.id === currentUser.id}
              isLoading={!comment}
              author={comment?.sender?.username}
              datetime={comment?.createAt}
              avatar={comment?.sender?.username}
              content={comment?.content}
            />
          </div>
        )}
      </CellMeasurer>
    );
  }

  const infiniteLoader = (
    <InfiniteLoader
      isRowLoaded={isRowLoaded}
      loadMoreRows={loadMoreRows}
      threshold={1}
      rowCount={commentCount}
    >
      {({ onRowsRendered, registerChild }) => (
        <AutoSizer>
          {({ width, height }) => (
            <VList
              style={{ outline: 'none', padding: '20px 10px' }}
              ref={(ref) => {
                vListRef.current = ref;
                registerChild(ref);
              }}
              className={'v-list'}
              height={height}
              width={width}
              rowCount={commentCount}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              onRowsRendered={onRowsRendered}
              overscanRowCount={1}
              estimatedRowSize={126}
              deferredMeasurementCache={cache}
            />
          )}
        </AutoSizer>
      )}
    </InfiniteLoader>
  );

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    if (isJpgOrPng && isLt2M) {
      console.log(file);
      getBase64(file, (base64) => setImageFile(base64));
      return true;
    } else {
      return false;
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    const objectName = moment().format('YYYYMMDDhhmmss');
    const ossClient = await getOssClient();
    const image = await fetch(imageFile);
    const blob = await image.blob();
    await ossClient.put(objectName, blob);
    handleSend(objectName, 'image');
    setImageFile(false);
    setUploading(false);
  };

  return (
    <div ref={commentListEle} style={{ height: '100%', minWidth: '250px', position: 'relative' }}>
      <Card
        bordered={false}
        style={{ height: 'calc(100vh - 300px)' }}
        bodyStyle={{ height: '100%', padding: 0 }}
      >
        {infiniteLoader}
      </Card>
      <Form form={form} onFinish={(v) => handleSend(v.content, 'text')}>
        <div style={{ padding: '10px 0', width: '100%' }}>
          <Space>
            <Upload disabled={isUploading} showUploadList={false} beforeUpload={beforeUpload}>
              <Button icon={<PictureOutlined />} />
            </Upload>
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
          {imageFile ? (
            <Button
              disabled={isUploading}
              style={{ float: 'right' }}
              icon={isUploading ? <LoadingOutlined /> : <PictureOutlined />}
              type="primary"
              onClick={handleUpload}
            >
              上传
            </Button>
          ) : (
            <Button
              icon={<MessageOutlined />}
              style={{ float: 'right' }}
              type="primary"
              htmlType="submit"
            >
              发送
            </Button>
          )}
        </div>
        {imageFile ? (
          <Image src={imageFile} />
        ) : (
          <Form.Item name="content" rules={contentRule}>
            <Mentions
              placeholder={'输入@来提醒某成员'}
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
        )}
      </Form>
    </div>
  );
};
export default forwardRef(TaskComment);
