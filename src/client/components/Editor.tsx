import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import { Button, Card, message, Spin } from 'antd';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { LogLevels, OutputData } from '@editorjs/editorjs';
import { Paragraph, Header, Image } from './editorTools';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
// import { IndexeddbPersistence } from "y-indexeddb";
import { EditorBinding } from './EditorBinding';

const { IndexeddbPersistence } = require('y-indexeddb/dist/y-indexeddb.cjs');

const Editor: React.FC<{
  wsRoom?: string;
  data?: OutputData;
  currentUser?: { id: number; username: string };
  editable?: boolean;
  update?: boolean;
  loading?: boolean;
  debug?: boolean;
  onChange?: Function;
}> = ({
  wsRoom,
  data,
  currentUser = { id: 0, username: 'unkown' },
  update = false,
  editable = false,
  loading = false,
  debug = false,
  onChange = () => {},
}) => {
  const bindingRef = useRef<EditorBinding>();
  const editorRef = useRef<EditorJS>();
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(false);

  const [isConnect, setConnect] = useState(false);
  const isReadyRef = useRef<boolean>();
  const isConnectRef = useRef<boolean>();
  const dragDropRef = useRef();
  isReadyRef.current = isReady;
  isConnectRef.current = isConnect;
  const websocketProviderRef = useRef<WebsocketProvider>();
  const indexeddbProviderRef = useRef<any>();

  //editor init
  useEffect(() => {
    if (debug) console.log('creating editor');
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
        config: {
          types: ['image/png', 'image/jpeg'],
          size: 2097152,
          onError: (err: Error) => {
            message.error(err.message);
          },
        },
      },
    };

    const editor = new EditorJS({
      holder: 'editorjs',
      data: data,
      tools: tools,
      logLevel: 'ERROR' as LogLevels,
      readOnly: !editable || !wsRoom,
      onReady: () => {
        const holder = document.getElementById('editorjs');
        if (data) setReady(true);
        if (editable && wsRoom && holder) new DragDrop(editor);
      },
      onChange: () => {
        onChange();
      },
    });
    editorRef.current = editor;
    if (wsRoom) {
      // wss://demos.yjs.dev
      // ws://localhost:3000
      const ydoc = new Y.Doc();
      const yArray = ydoc.getArray('editorjs');
      const indexeddbProvider = new IndexeddbPersistence(wsRoom, ydoc);
      const websocketProvider = new WebsocketProvider(
        process.env.WS || 'ws://localhost:3000',
        wsRoom,
        ydoc,
        {
          params: {
            target: 'editorjs',
          },
        },
      );
      indexeddbProvider.on('synced', async () => {
        await editor.isReady;
        const binding = new EditorBinding(editor, yArray, debug);
        bindingRef.current = binding;
        await binding.isReady;
        setReady(true);
      });
      websocketProvider.on('sync', async (isSynced: boolean) => {
        if (debug) console.log(`wsProvider state: ${isSynced}`);
        setConnect(isSynced);
      });
      yDocRef.current = ydoc;
      websocketProviderRef.current = websocketProvider;
      indexeddbProviderRef.current = indexeddbProvider;
    }

    return () => {
      if (debug) console.log('destroy editor');
      if (editorRef.current.destroy) editorRef.current.destroy();
      if (websocketProviderRef.current) websocketProviderRef.current.destroy();
      if (indexeddbProviderRef.current) indexeddbProviderRef.current.destroy();
    };
  }, [update]);

  // useEffect(() => {
  //   if (data) {
  //     console.log(data)
  //     editorRef.current.isReady.then(async () => {
  //       if (data.blocks.length > 0) await editorRef.current.render(data);
  //       setReady(true);
  //     });
  //   }
  // }, [data]);

  const showSaved = () => {
    console.log(
      yDocRef.current
        .getArray('editorjs')
        .toArray()
        .map((item: Y.Map<any>) => item.toJSON()),
    );
  };

  return (
    <div style={{ padding: 10 }}>
      {/* <Button onClick={showSaved}>showSaved</Button> */}
      {(loading || !isReady) && <Spin />}
      <div id="editorjs" style={{ visibility: loading || !isReady ? 'hidden' : 'visible' }}></div>
    </div>
  );
};
export default Editor;
