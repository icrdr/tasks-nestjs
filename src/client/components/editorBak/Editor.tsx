import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import { Button, Card, Spin } from 'antd';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { API, BlockAPI, LogLevels, OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import ImageTool from '@editorjs/image';
import moment from 'moment';
import * as Y from 'yjs';
import { MoveEvent } from '@editorjs/editorjs/types/tools';
import { WebsocketProvider } from 'y-websocket';
import { createMutex } from 'lib0/mutex.js';
import { YArrayEvent, YMapEvent } from 'yjs';
import { Yeditor } from './yeditor';

const Editor: React.FC<{
  currentUser?: { id: number; username: string };
  content?: OutputData;
  editable?: boolean;
  loading?: boolean;
  onReady?: (editor: EditorJS) => void;
  onChange?: (editor: EditorJS) => void;
  onSaved?: (output?: OutputData) => void;
}> = ({
  currentUser = { id: 1, username: 'unkown' },
  content,
  editable = false,
  loading = false,
  onReady = () => {},
  onChange = () => {},
  onSaved = () => {},
}) => {
  const { initialState } = useModel('@@initialState');
  const { ossClient } = initialState;
  const location = useLocation() as any;
  const editorRef = useRef<Yeditor>();
  const [isReady, setReady] = useState(true);
  const readyRef = useRef<boolean>(false);
  readyRef.current = isReady;
  const divRef = useRef();

  //editor init
  useEffect(() => {
    editorRef.current = new Yeditor({
      holder: 'editorjs',
      editable: true,
    });

    return () => {
      editorRef.current.destroy();
    };
  }, []);

  const handle = () => {
    console.log(editorRef.current.yarray.toArray().map((item) => item.toJSON()));
    // editorRef.current.blocks.insert("paragraph", { text: "ssssss" }, {}, 0);
  };
  return (
    <Card style={{ padding: 10 }}>
      {(loading || !isReady) && <Spin />}
      <Button onClick={handle}>sdfsefsefasefe</Button>
      <div
        ref={divRef}
        id="editorjs"
        style={{ visibility: loading || !isReady ? 'hidden' : 'visible' }}
      ></div>
    </Card>
  );
};
export default Editor;
