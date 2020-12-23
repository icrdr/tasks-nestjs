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
import { EditorBinding } from './y-editor';

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
  const editorRef = useRef<EditorJS>();
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(true);
  const readyRef = useRef<boolean>(false);
  readyRef.current = isReady;
  const divRef = useRef();

  //editor init
  useEffect(() => {
    const holder1 = document.getElementById('editorjs');
    const ydoc1 = new Y.Doc();
    function toolWrapper(Tool: any, currentUser: any) {
      const wrapper = class extends Tool {
        _block: BlockAPI;
        _api: API;
        _modifier: { id: number; username: string };
        _blockContent: HTMLElement;

        constructor({ data, config, api, readOnly, block }) {
          super({ data, config, api, readOnly, block });
          this._block = block;
          this._api = api;
          this._modifier = data.modifier || currentUser;
        }

        save(blockContent: HTMLElement) {
          const output = super.save(blockContent);
          return output;
        }

        render() {
          return super.render();
        }

        rendered() {
          if (super.rendered) super.rendered();
        }

        updated() {
          if (super.updated) super.updated();
        }

        moved(event: MoveEvent) {
          if (super.moved) super.moved(event);
        }

        removed() {
          if (super.removed) super.removed();
        }
      };
      return wrapper;
    }

    const tools = {
      header: {
        class: toolWrapper(Header, currentUser),
        config: {
          levels: [1, 2, 3],
          defaultLevel: 1,
        },
        inlineToolbar: ['link'],
      },
      paragraph: {
        class: toolWrapper(Paragraph, currentUser),
        config: {
          preserveBlank: true,
        },
      },
    };

    const editor1 = new EditorJS({
      holder: 'editorjs',
      tools: tools,
      logLevel: "ERROR" as LogLevels,
      onReady: () => {
        if (editable) new DragDrop(editor1);
        const binding1 = new EditorBinding(editor1, divRef.current, ydoc1.getArray('docId'));
      },
    });
    const provider = new WebsocketProvider(
      'ws://localhost:3000',
      'edibbasnnnnnnnnbbbbbbbbn556666666666nnnnnnnnnnbef',
      ydoc1,
    );
    yDocRef.current = ydoc1;
    editorRef.current = editor1;
    return () => {
      editorRef.current.destroy();
    };
  }, []);

  const handle = () => {
    console.log(
      yDocRef.current
        .getArray('docId')
        .toArray()
        .map((item) => item.toJSON()),
    );
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
