import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import { Button, Card, Spin } from 'antd';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { LogLevels, OutputData } from '@editorjs/editorjs';
import { Paragraph, Header, Image } from './editorTools';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
// import { IndexeddbPersistence } from "y-indexeddb";
import { EditorBinding } from './EditorBinding';
import { CloudOutlined, DisconnectOutlined, SyncOutlined } from '@ant-design/icons';

const { IndexeddbPersistence } = require('y-indexeddb/dist/y-indexeddb.cjs');

const Editor: React.FC<{
  wsRoom?: string;
  data?: OutputData;
  currentUser?: { id: number; username: string };
  editable?: boolean;
  loading?: boolean;
}> = ({
  wsRoom,
  data,
  currentUser = { id: 0, username: 'unkown' },
  editable = false,
  loading = false,
}) => {
  const bindingRef = useRef<EditorBinding>();
  const editorRef = useRef<EditorJS>();
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(false);
  const [isConnect, setConnect] = useState(false);
  const isReadyRef = useRef<boolean>();
  const isConnectRef = useRef<boolean>();
  isReadyRef.current = isReady;
  isConnectRef.current = isConnect;
  const websocketProviderRef = useRef<WebsocketProvider>();
  const indexeddbProviderRef = useRef<any>();

  //editor init
  useEffect(() => {
    const tools = {
      header: {
        class: Header,
        config: {
          levels: [1, 2, 3],
          defaultLevel: 1,
        },
        inlineToolbar: ['link'],
      },
      paragraph: {
        class: Paragraph,
        config: {
          preserveBlank: true,
        },
      },
      image: {
        class: Image,
      },
    };
    const editor = new EditorJS({
      holder: 'editorjs',
      data: data,
      tools: tools,
      logLevel: 'ERROR' as LogLevels,
      readOnly: !editable && !wsRoom,
      onReady: () => {
        if (editable || wsRoom) new DragDrop(editor);
      },
    });
    editorRef.current = editor;

    if (wsRoom && !data) {
      // wss://demos.yjs.dev
      // ws://localhost:3000
      const ydoc = new Y.Doc();
      const yArray = ydoc.getArray('editorjs');
      const indexeddbProvider = new IndexeddbPersistence(wsRoom, ydoc);
      const websocketProvider = new WebsocketProvider('ws://localhost:3000', wsRoom, ydoc);
      indexeddbProvider.on('synced', async () => {
        await editor.isReady;
        const binding = new EditorBinding(editor, yArray);
        bindingRef.current = binding;
        await binding.isReady;
        setReady(true);
      });
      websocketProvider.on('sync', async (isSynced: boolean) => {
        console.log(`wsProvider state: ${isSynced}`);
        setConnect(isSynced);
      });
      yDocRef.current = ydoc;
      websocketProviderRef.current = websocketProvider;
      indexeddbProviderRef.current = indexeddbProvider;
    }

    return () => {
      if (editorRef.current.destroy) editorRef.current.destroy();
      if (websocketProviderRef.current) websocketProviderRef.current.destroy();
      if (indexeddbProviderRef.current) indexeddbProviderRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (data) {
      editorRef.current.isReady.then(async () => {
        await editorRef.current.render(data);
        setReady(true);
      });
    }
  }, [data]);

  const showSaved = () => {
    console.log(
      yDocRef.current
        .getArray('editorjs')
        .toArray()
        .map((item: Y.Map<any>) => item.toJSON()),
    );
  };

  return (
    <Card style={{ padding: 10 }} extra={isConnect ? <CloudOutlined /> : <DisconnectOutlined />}>
      {/* <Button onClick={showSaved}>showSaved</Button> */}
      {(loading || !isReady) && <Spin />}
      <div id="editorjs" style={{ visibility: loading || !isReady ? 'hidden' : 'visible' }}></div>
    </Card>
  );
};
export default Editor;
