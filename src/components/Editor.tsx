import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useLocation, useModel, useParams, useRequest } from 'umi';
// import ProCard from '@ant-design/pro-card';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { API, BlockAPI, LogLevels, OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import { useMount } from 'ahooks';
import { useLayoutEffect } from 'react';
import { useMemo } from 'react';
import { Button, Card, Spin } from 'antd';

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
  editable = true,
  loading = false,
  loadLocal = true,
  saveLocal = true,
  onReady = () => {},
  onChange = () => {},
  onSaved = () => {},
}) => {
  const location = useLocation() as any;
  const editorRef = useRef<EditorJS>();
  const divRef = useRef();
  const getLocalContent = (id: number): OutputData => {
    return JSON.parse(localStorage.getItem(id.toString())) as OutputData;
  };

  const setLocalContent = (id: number, content: OutputData) => {
    localStorage.setItem(id.toString(), JSON.stringify(content));
  };

  function toolWrapper(Tool: any) {
    const wrapper = class extends Tool {
      _block: BlockAPI;
      _modifier: any;
      constructor({ block, data, config, api, readOnly }) {
        //call on block's creation (init editor or insert a new block)
        super({ block, data, config, api, readOnly });
        this._block = block;
        this._modifier = data.modifier || currentUser;
      }

      save(blockContent: HTMLElement) {
        //call on every block when save
        const output = super.save(blockContent);
        if (this._modifier) output['modifier'] = this._modifier;
        return output;
      }

      updateModifier() {
        this._modifier = currentUser;
      }

      updateModifierUI() {
        if (this._modifier) this._block.holder.setAttribute('modifier', this._modifier?.username);
      }

      render() {
        return super.render();
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
  };

  const updateModifierUI = () => {
    const blocksCount = editorRef.current.blocks.getBlocksCount();
    for (let i = 0; i < blocksCount; i++) {
      const block = editorRef.current.blocks.getBlockByIndex(i) as BlockAPI;
      block.call('updateModifierUI');
    }
  };
  const updateModifier = () => {
    const currentIndex = editorRef.current.blocks.getCurrentBlockIndex();
    const block = editorRef.current.blocks.getBlockByIndex(currentIndex) as BlockAPI;
    block.call('updateModifier');
    updateModifierUI();
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
        onReady(editorRef.current);
      },
      onChange: () => {
        updateModifier();
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
        updateModifierUI();
      });
    }
  }, [content]);

  return (
    <Card className='p:5' loading={loading}>
      <div ref={divRef} id="editorjs"></div>
    </Card>
  );
};
export default Editor;
