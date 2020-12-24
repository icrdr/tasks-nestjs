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
import { EditorBinding } from './EditorBinding';
import OSS from 'ali-oss';

const Editor: React.FC<{
  currentUser?: { id: number; username: string };
  editable?: boolean;
  loading?: boolean;
  onReady?: (editor: EditorJS) => void;
  onChange?: (editor: EditorJS) => void;
  onSaved?: (output?: OutputData) => void;
}> = ({ currentUser = { id: 1, username: 'unkown' }, editable = false, loading = false }) => {
  const { initialState } = useModel('@@initialState');
  const { ossClient } = initialState;
  const location = useLocation() as any;
  const editorRef = useRef<EditorJS>();
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(true);
  const readyRef = useRef<boolean>(false);
  const bindingRef = useRef<EditorBinding>();
  readyRef.current = isReady;
  const divRef = useRef();

  class ossImageTool extends ImageTool {
    ossClient: OSS;
    constructor({ data, config, api, readOnly, block }) {
      //call on block's creation (init editor or insert a new block)
      super({ data, config, api, readOnly, block });
      this.ossClient = config.ossClient;
      const imagePreloader = (this as ImageTool).ui.nodes.imagePreloader;
      const imageContainer = (this as ImageTool).ui.nodes.imageContainer;
      imagePreloader.className = 'oss-image-tool__image-preloader';
      imageContainer.className = 'oss-image-tool__image';

      const spin = document.createElement('span');
      spin.classList.add('ant-spin-dot', 'ant-spin-dot-spin');
      for (let index = 0; index < 4; index++) {
        const dot = document.createElement('i');
        dot.className = 'ant-spin-dot-item';
        spin.append(dot);
      }
      const contrainer = document.createElement('div');
      contrainer.className = 'oss-image-tool__image-preloader-contrainer';

      contrainer.append(imagePreloader);
      contrainer.append(spin);
      imageContainer.append(contrainer);
    }

    set image(file: { url?: string; ossObject?: string }) {
      (this as ImageTool)._data.file = file || {};
      if (file) {
        if (file.url) {
          (this as ImageTool).ui.fillImage(file.url);
        } else if (file.ossObject) {
          const url = this.ossClient.signatureUrl(file.ossObject, {
            expires: 3600,
          });
          console.log(url);
          (this as ImageTool).ui.fillImage(url);
        }
      }
    }

    removed() {
      const ossObject = (this as ImageTool)._data.file?.ossObject;
      console.log((this as ImageTool)._data);
      if (ossObject) {
        this.ossClient
          .delete(ossObject)
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
  }

  const uploadByFile = async (file: any) => {
    const objectName = moment().format('YYYYMMDDhhmmss');
    const res = await ossClient.put(objectName, file);
    console.log(res);
    return {
      success: 1,
      file: {
        ossObject: objectName,
      },
    };
  };

  const uploadByUrl = (url: string) => {
    return new Promise(function (resolve, reject) {
      resolve({
        success: 1,
        file: {
          url: url,
        },
      });
    });
  };
  //editor init
  useEffect(() => {
    function toolWrapper(Tool: any) {
      const wrapper = class extends Tool {
        _block: BlockAPI;
        _api: API;
        _blockContent: HTMLElement;

        constructor({ data, config, api, readOnly, block }) {
          super({ data, config, api, readOnly, block });
          this._block = block;
          this._api = api;
        }

        save(blockContent: HTMLElement) {
          const output = super.save(blockContent);
          return output;
        }

        static getSave(blockContent: HTMLElement) {
          return super.save(blockContent);
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
        class: toolWrapper(Header),
        config: {
          levels: [1, 2, 3],
          defaultLevel: 1,
        },
        inlineToolbar: ['link'],
      },
      paragraph: {
        class: toolWrapper(Paragraph),
        config: {
          preserveBlank: true,
        },
      },
      image: {
        class: toolWrapper(ossImageTool),
        config: {
          uploader: {
            uploadByFile,
            uploadByUrl,
          },
        },
      },
    };
    const ydoc = new Y.Doc();
    const yArray = ydoc.getArray('editorjs');
    const editor = new EditorJS({
      holder: 'editorjs',
      tools: tools,
      logLevel: 'ERROR' as LogLevels,
      onReady: () => {
        if (editable) new DragDrop(editor);
        const binding = new EditorBinding(editor, yArray);
        bindingRef.current = binding;
      },
    });
    const provider = new WebsocketProvider('ws://localhost:3000', 'dd', ydoc);
    yDocRef.current = ydoc;
    editorRef.current = editor;

    return () => {
      editorRef.current.destroy();
    };
  }, []);
  const showSaved = () => {
    console.log(
      yDocRef.current
        .getArray('editorjs')
        .toArray()
        .map((item: Y.Map<any>) => item.toJSON()),
    );
  };

  return (
    <Card style={{ padding: 10 }}>
      <Button onClick={showSaved}>showSaved</Button>
      {(loading || !isReady) && <Spin />}
      <div
        ref={divRef}
        id="editorjs"
        style={{ visibility: loading || !isReady ? 'hidden' : 'visible' }}
      ></div>
    </Card>
  );
};
export default Editor;
