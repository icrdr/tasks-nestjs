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

const Editor: React.FC<{
  currentUser?: { id: number; username: string };
  content?: OutputData;
  editable?: boolean;
  loading?: boolean;
  loadLocal?: boolean;
  saveLocal?: boolean;
  onReady?: (editor: EditorJS) => void;
  onChange?: (editor: EditorJS) => void;
  onSaved?: (output?: OutputData) => void;
}> = ({
  currentUser = { id: 1, username: 'unkown' },
  content,
  editable = false,
  loading = false,
  loadLocal = true,
  saveLocal = true,
  onReady = () => {},
  onChange = () => {},
  onSaved = () => {},
}) => {
  const { initialState } = useModel('@@initialState');
  const { ossClient } = initialState;
  const location = useLocation() as any;
  const editorRef = useRef<EditorJS>();
  const [isReady, setReady] = useState(false);
  const divRef = useRef();
  const getLocalContent = (id: number): OutputData => {
    return JSON.parse(localStorage.getItem(id.toString())) as OutputData;
  };

  const setLocalContent = (id: number, content: OutputData) => {
    localStorage.setItem(id.toString(), JSON.stringify(content));
  };

  class ossImageTool extends ImageTool {
    constructor({ data, config, api, readOnly, block }) {
      //call on block's creation (init editor or insert a new block)
      super({ data, config, api, readOnly, block });
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
          const url = ossClient.signatureUrl(file.ossObject, { expires: 3600 });
          console.log(url);
          (this as ImageTool).ui.fillImage(url);
        }
      }
    }

    removed() {
      const ossObject = (this as ImageTool)._data.file?.ossObject;
      console.log((this as ImageTool)._data);
      if (ossObject) {
        ossClient
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
    try {
      const objectName = moment().format('YYYYMMDDhhmmss');
      const res = await ossClient.put(objectName, file);
      console.log(res);
      return {
        success: 1,
        file: {
          ossObject: objectName,
        },
      };
    } catch (e) {
      console.error(e);
    }
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

  function toolWrapper(Tool: any) {
    const wrapper = class extends Tool {
      _block: BlockAPI;
      _api: API;
      _modifier: { id: number; username: string };
      constructor({ data, config, api, readOnly, block }) {
        //call on block's creation (init editor or insert a new block)
        super({ data, config, api, readOnly, block });
        this._block = block;
        this._api = api;
        this._modifier = data.modifier || currentUser;
      }

      save(blockContent: HTMLElement) {
        //call on every block when save
        const output = super.save(blockContent);
        if (this._modifier) output['modifier'] = this._modifier;
        return output;
      }

      updateModifierUI() {
        if (this._modifier) this._block.holder.setAttribute('modifier', this._modifier?.username);
      }

      render() {
        return super.render();
      }

      rendered() {
        if (super.rendered) super.rendered();
        this.updateModifierUI();
      }

      updated() {
        if (super.updated) super.updated();
        this._modifier = currentUser;
        this.updateModifierUI();
      }

      removed() {
        if (super.removed) super.removed();
        const currentIndex = this._api.blocks.getCurrentBlockIndex();
        if (currentIndex === 0) return;
        const preBlock = this._api.blocks.getBlockByIndex(currentIndex - 1) as BlockAPI;
        const preBlockEle = preBlock?.holder.firstChild.firstChild as HTMLElement;
        if (preBlockEle) preBlockEle.focus();
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

  //editor init
  useEffect(() => {
    const _editor = new EditorJS({
      holder: 'editorjs',
      tools: tools,
      readOnly: !editable,
      logLevel: 'ERROR' as LogLevels,
      onReady: () => {
        if (!divRef.current) return;
        if (editable) new DragDrop(editorRef.current);
        setReady(true);
        onReady(editorRef.current);
      },
      onChange: () => {
        onChange(editorRef.current);
        editorRef.current.saver.save().then((res) => {
          if (saveLocal) setLocalContent(location.pathname, res);
          onSaved(res);
        });
      },
    });
    editorRef.current = _editor;
    return () => {
      editorRef.current.isReady.then(async () => {
        editorRef.current.destroy();
      });
    };
  }, []);

  useEffect(() => {
    if (content) {
      //get loaclContent and update if exists
      if (loadLocal) {
        const localContent = getLocalContent(location.pathname);
        if (localContent && localContent?.time > content?.time) {
          content = localContent;
        }
      }
      //rerender content when editor is ready
      editorRef.current.isReady.then(async () => {
        if (!divRef.current) return;
        await editorRef.current.render(content);
      });
    }
  }, [content]);

  return (
    <Card style={{ padding: 10 }}>
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
