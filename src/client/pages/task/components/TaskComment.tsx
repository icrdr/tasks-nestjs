import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  Form,
  Mentions,
  Popover,
  Space,
  message,
  Upload,
  Image,
} from "antd";
import Cookies from "js-cookie";
import { CommentRes } from "@dtos/task.dto";
import useWebSocket from "@hooks/useWebSocket";
import { useModel, useRequest } from "umi";
import { getSpaceMembers } from "../../member/member.service";
import { MemberRes } from "@dtos/space.dto";
import {
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  PlusOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Picker } from "emoji-mart";
import { getTaskComments } from "../task.service";
import MessageCard from "./MessageCard";
import { useInterval } from "ahooks";
import { getBase64, sleep } from "@utils/utils";
import moment from "moment";
import { getOssClient } from "../../layout/layout.service";
import { RcFile } from "antd/lib/upload";
import FsLightbox from "@components/fslightbox";
import { VariableSizeList, FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";

const TaskComment = ({ taskId }, ref) => {
  const { initialState } = useModel("@@initialState");
  const { currentUser, currentSpace } = initialState;

  const ListRef = useRef<VariableSizeList>(null);
  const [form] = Form.useForm();
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);
  const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [afterFirstFetch, setAfterFirstFetch] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const [scrollInterval, setScrollInterval] = useState(null);
  const [scrollTargetIndex, setScrollTargetIndex] = useState(0);
  const scrollTargetIndexRef = useRef<number>();
  const afterFirstFetchRef = useRef<boolean>();
  const commentListRef = useRef(null);
  commentListRef.current = commentList;
  scrollTargetIndexRef.current = scrollTargetIndex;
  afterFirstFetchRef.current = afterFirstFetch;

  // const size = useSize(commentListEle)
  useRequest(() => getTaskComments(taskId), {
    ready: !!taskId,
    onSuccess: (res) => {
      setCommentList(Array(res.total).fill(undefined));
      scrollToBottom();
    },
  });

  const recomputeRowHeights = () => {
    // cache.clearAll();
    // ListRef.current.recomputeRowHeights();
  };

  const scrollToDate = (date: Date) => {
    getTaskComments(taskId, { dateAfter: date }).then((res) => {
      console.log(res.list[0].index);
      ListRef.current.scrollToItem(res.list[0].index);
      // sleep(0).then(() => {
      //   setScrollTargetIndex(res.list[0].index);
      //   setScrollInterval(200);
      // });
    });
  };

  const scrollToBottom = () => {
    ListRef.current.scrollToItem(commentList.length - 1);
    // sleep(0).then(() => {
    //   setScrollTargetIndex(commentList.length - 1);
    //   setScrollInterval(200);
    // });
  };

  useInterval(
    () => {
      // const list = document.getElementsByClassName("v-list")[0];
      // const offset = ListRef.current.getOffsetForRow({
      //   alignment: "start",
      //   index: scrollTargetIndex,
      // });
      // // console.log('current top', list.scrollTop);
      // // console.log('scroll to', offset);
      // if (list.scrollTop + 10 < offset || list.scrollTop - 10 > offset) {
      //   ListRef.current.scrollToPosition(offset);
      // } else {
      //   setScrollInterval(null);
      // }
    },
    scrollInterval,
    { immediate: true }
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
      for (const comment of res.list) {
        commentListRef.current[comment.index] = comment;
      }
      setCommentList(commentList);
      setLightBoxUpdate(lightBoxUpdate + 1);
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

  const { sendMessage, connect } = useWebSocket(
    `ws://localhost:3000?target=discuss&taskId=${taskId}`,
    {
      reconnectInterval: 5000,
      manual: true,
      protocols: Cookies.get("token"),
      onMessage: (msg: WebSocketEventMap["message"]) => {
        const data = JSON.parse(msg.data);
        console.log(data);
        if (!data.status) {
          setCommentList([...commentListRef.current, data]);
          setLightBoxUpdate(lightBoxUpdate + 1);
          recomputeRowHeights();
          const isUserSending = data.sender.id === currentUser.id;
          const list = document.getElementsByClassName("v-list")[0];
          const isNearBottom =
            list.scrollTop + list.clientHeight + 300 < list.scrollHeight;
          if (isUserSending || isNearBottom) {
            scrollToBottom();
          }
        } else {
          message.error(data.message);
        }
      },
    }
  );

  useEffect(() => {
    if (taskId) connect();
  }, [taskId]);

  const handleSend = (content: string, type: string) => {
    const data = {
      taskId: taskId,
      content: content,
      type: type,
    };

    const sendData = JSON.stringify({ event: "comment", data });
    sendMessage(sendData);
    form.resetFields();
  };

  const handleEmojiSelete = (emoji) => {
    const preValue = form.getFieldsValue();
    preValue.content = preValue.content
      ? preValue.content + emoji.native
      : emoji.native;
    form.setFieldsValue(preValue);
  };
  const contentRule = [
    {
      required: true,
      message: "必填",
    },
  ];

  function isItemLoaded(index: number) {
    return !!commentList[index];
  }

  function loadMoreItems(startIndex: number, stopIndex: number) {
    //cancel the fetch right after the first bottom fetch.
    if (stopIndex === commentList.length - 1) {
      setAfterFirstFetch(true);
      sleep(1000).then(() => {
        setAfterFirstFetch(false);
      });
    }
    return afterFirstFetchRef.current
      ? Promise.resolve()
      : getCommentsReq.run(taskId, {
          skip: startIndex,
          take: stopIndex - startIndex + 1,
        });
  }

  const Row = ({ index, style }) => {
    const comment = commentList[index];
    if (comment?.type === "image" && !comment["_source"]) {
      comment["_source"] = "url";
      getOssClient().then((oss) => {
        comment["_source"] = oss.signatureUrl(comment.content, {
          expires: 3600,
        });
        comment["_preview"] = oss.signatureUrl(comment.content, {
          expires: 3600,
          process: "image/resize,w_300,h_300",
        });
      });
    }

    return (
      <div style={{ ...style }}>
        <MessageCard
          onTapContent={() => {
            if (comment?.type === "image") {
              const sourceList = commentList
                .filter((comment) => comment?.type === "image")
                .map((comment) => comment["_source"]);
              const i = sourceList.indexOf(comment["_source"]);
              setLightBoxSlide(i);
              setLightBoxToggle(!lightBoxToggle);
            }
          }}
          type={comment?.type}
          isMe={comment?.sender?.id === currentUser.id}
          isLoading={!comment}
          author={comment?.sender?.username}
          datetime={comment?.createAt}
          avatar={comment?.sender?.username}
          content={
            comment?.type === "image" ? comment["_preview"] : comment?.content
          }
        />
      </div>
    );
  };
  const getItemSize = (index: number) => {
    return 86;
  };

  const infiniteLoader = (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={commentList.length}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <AutoSizer>
          {({ width, height }) => (
            <VariableSizeList
              itemCount={commentList.length}
              onItemsRendered={onItemsRendered}
              height={height}
              width={width}
              estimatedItemSize={86}
              itemSize={getItemSize}
              ref={(r) => {
                ListRef.current = r;
                return ref;
              }}
            >
              {Row}
            </VariableSizeList>
          )}
        </AutoSizer>
      )}
    </InfiniteLoader>
  );

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUpload = async (options) => {
    setUploading(true);
    const objectName = moment().format("YYYYMMDDhhmmss");
    const ossClient = await getOssClient();
    await ossClient.put(objectName, options.file);
    handleSend(objectName, "image");
    setUploading(false);
  };

  return (
    <div style={{ height: "100%", minWidth: "250px", position: "relative" }}>
      <Card
        bordered={false}
        style={{ height: "calc(100vh - 300px)" }}
        bodyStyle={{ height: "100%", padding: 0 }}
      >
        {infiniteLoader}
      </Card>
      <Form form={form} onFinish={(v) => handleSend(v.content, "text")}>
        <div style={{ padding: "10px 0", width: "100%" }}>
          <Space>
            <Upload
              disabled={isUploading}
              showUploadList={false}
              customRequest={handleUpload}
              beforeUpload={beforeUpload}
            >
              <Button icon={<PictureOutlined />} />
            </Upload>
            <Popover
              trigger={"click"}
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
          <Button
            disabled={isUploading}
            icon={isUploading ? <LoadingOutlined /> : <MessageOutlined />}
            style={{ float: "right" }}
            type="primary"
            htmlType="submit"
          >
            发送
          </Button>
        </div>
        <Form.Item name="content" rules={contentRule}>
          <Mentions
            placeholder={"输入@来提醒某成员"}
            style={{ width: "100%" }}
            loading={getSpaceMembersReq.loading}
            autoSize={{ minRows: 4, maxRows: 8 }}
            onSearch={(text) => {
              console.log("text");
              getSpaceMembersReq.run(currentSpace.id, { username: text });
            }}
          >
            {memberList.map((member) => (
              <Mentions.Option
                key={member.userId.toString()}
                value={member.username}
              >
                <span>{member.username}</span>
              </Mentions.Option>
            ))}
          </Mentions>
        </Form.Item>
      </Form>
      <FsLightbox
        key={lightBoxUpdate}
        style={{ zIndex: 99999 }}
        toggler={lightBoxToggle}
        sourceIndex={lightBoxSlide}
        sources={commentList
          .filter((comment) => comment?.type === "image")
          .map((comment) => comment["_source"])}
        type="image"
      />
    </div>
  );
};
export default forwardRef(TaskComment);
