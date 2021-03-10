import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';
import { Button, Card, Input, message, Spin } from 'antd';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { LogLevels, OutputData } from '@editorjs/editorjs';
import { Paragraph, Header, Image } from './editorTools';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
// import { IndexeddbPersistence } from "y-indexeddb";
import { EditorBinding } from './EditorBinding';
import { nanoid } from 'nanoid';

const { IndexeddbPersistence } = require('y-indexeddb/dist/y-indexeddb.cjs');

const Editor: React.FC<{
  wsRoom?: string;
  data?: OutputData;
  editable?: boolean;
  update?: boolean;
  loading?: boolean;
  debug?: boolean;
  onChange?: Function;
}> = ({
  wsRoom,
  data,
  update = false,
  editable = false,
  loading = false,
  debug = false,
  onChange = () => {},
}) => {
  const bindingRef = useRef<EditorBinding>();
  const editorMapRef = useRef<Map<string, EditorJS>>(new Map());
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(false);

  const [isConnect, setConnect] = useState(false);
  const isReadyRef = useRef<boolean>();
  const isConnectRef = useRef<boolean>();

  isReadyRef.current = isReady;
  isConnectRef.current = isConnect;
  const websocketProviderRef = useRef<WebsocketProvider>();
  const indexeddbProviderRef = useRef<any>();
  const [uuid, setUuid] = useState(undefined);
  const [holderUpdate, setHolderUpdate] = useState(0);

  //editor init
  useEffect(() => {
    const _uuid = nanoid();
    setUuid(_uuid);
    //force recreate holder rather than just change id
    setHolderUpdate(holderUpdate + 1);
    if (debug) console.log('creating editor', _uuid);
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
      holder: `editorjs-${_uuid}`,
      data: data,
      tools: tools,
      logLevel: 'ERROR' as LogLevels,
      readOnly: !editable || !wsRoom,
      onReady: () => {
        if (debug) console.log('editor is ready', _uuid);
        const holder = document.getElementById(`editorjs`);
        if (holder) {
          if (data) setReady(true);
          if (editable && wsRoom) new DragDrop(editor);
        }
      },
      onChange: () => {
        onChange();
      },
    });
    editorMapRef.current.set(_uuid, editor);

    if (wsRoom) {
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
        const holder = document.getElementById(`editorjs-${_uuid}`);
        if (holder) {
          const binding = new EditorBinding(editor, yArray, debug);
          bindingRef.current = binding;
          await binding.isReady;
          setReady(true);
        }
      });

      websocketProvider.on('sync', async (isSynced: boolean) => {
        // if (debug) console.log(`wsProvider state: ${isSynced}`);
        setConnect(isSynced);
      });

      yDocRef.current = ydoc;
      websocketProviderRef.current = websocketProvider;
      indexeddbProviderRef.current = indexeddbProvider;
    }
    return () => {
      if (debug) console.log('destroy editor', _uuid);
      const editorInstance = editorMapRef.current.get(_uuid);

      if (editorInstance.destroy) {
        editorInstance.destroy();
      } else {
        editorInstance.isReady.then(() => {
          editorInstance.destroy();
        });
      }

      if (websocketProviderRef.current) websocketProviderRef.current.destroy();
      if (indexeddbProviderRef.current) indexeddbProviderRef.current.destroy();
    };
  }, [update, data, wsRoom]);


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
      {(loading || !isReady) && <Spin />}
      <div
        key={holderUpdate}
        id={`editorjs-${uuid}`}
        style={{ visibility: loading || !isReady ? 'hidden' : 'visible' }}
      ></div>
    </div>
  );
};
export default Editor;
