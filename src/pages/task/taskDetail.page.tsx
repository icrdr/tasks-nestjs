import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography, Button, message } from 'antd';
import { Access, useAccess, useModel, useParams, useRequest } from 'umi';
import { EDITOR_JS_TOOLS } from '@/components/tools';
import DragDrop from 'editorjs-drag-drop';
import EditorJS, { BlockAPI, LogLevels, OutputData } from '@editorjs/editorjs';
import ProCard from '@ant-design/pro-card';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import { updateTask } from './task.service';
import { getTask } from '../adminTask/adminTask.service';

export function toolWrapper(Tool: any) {
  const wrapper = class extends Tool {
    public inputData: any;
    constructor({ data, config, api, readOnly }) {
      super({ data, config, api, readOnly });
      this.inputData = data;
    }

    save(blockContent: HTMLElement) {
      const output = super.save(blockContent);
      if (this.inputData.modifier) {
        output['modifier'] = this.inputData.modifier;
      }
      return output;
    }

    render() {
      const block = super.render();
      const container = document.createElement('div');
      container.className = 'ce-block-container';
      const modifier = document.createElement('div');
      modifier.className = 'ce-block-modifier';
      const text = document.createTextNode(this.inputData.modifier?.username);
      modifier.append(text);
      container.append(modifier);
      container.append(block);
      return container;
    }
  };
  return wrapper;
}

export const tools = {
  header: {
    class: toolWrapper(Header),
    config: {
      levels: [1, 2, 3],
      defaultLevel: 1,
    },
    inlineToolbar: true,
  },
  paragraph: {
    class: toolWrapper(Paragraph),
    config: {
      preserveBlank: true,
    },
  },
};

const getLocalContent = (id: number): OutputData => {
  return JSON.parse(localStorage.getItem(id.toString())) as OutputData;
};

const setLocalContent = (id: number, content: OutputData) => {
  localStorage.setItem(id.toString(), JSON.stringify(content));
};

const TaskDetail: React.FC<{}> = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState;
  const params = useParams() as any;
  const getTaskReq = useRequest(() => getTask(params.id), {});
  const [editor, setEditor] = useState<EditorJS>();
  const [isOnChange, setOnChange] = useState(true);
  // const [state, setstate] = useState()
  const saveContentReq = useRequest((editor: EditorJS) => {
    return editor.save() }, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setLocalContent(params.id, res);
    },
    formatResult: (res) => {
      const currentIndex = editor.blocks.getCurrentBlockIndex();
      const currentBlock = res.blocks[currentIndex];
      if (currentBlock) currentBlock.data['modifier'] = currentUser;
      setOnChange(false);
      editor.render(res)
      // const block = editor.blocks.getBlockByIndex(currentIndex) as BlockAPI;
      // const blockEle = block.holder;
      // const modifierEle = blockEle.getElementsByClassName('ce-block-modifier')[0];
      // modifierEle.innerHTML = currentUser.username;
      // setOnChange(true);
      return res;
    },
    ready: isOnChange,
  });

  const updateTaskReq = useRequest(() => updateTask(params.id, { content: saveContentReq.data }), {
    onSuccess: (res) => {
      localStorage.removeItem(params.id.toString());
      console.log(res);
    },
    ready: !!saveContentReq.data,
    refreshDeps: [saveContentReq.data],
  });

  const { data } = getTaskReq;

  useEffect(() => {
    if (data) {
      const isEditable = data.state === 'inProgress';
      let content = data?.content as OutputData;

      //get loaclContent and update if exists
      const localContent = getLocalContent(params.id);
      if (isEditable && localContent && localContent?.time > content?.time) {
        content = localContent;
        updateTask(params.id, { content: content });
      }

      const editor = new EditorJS({
        data: content,
        holder: 'editorjs',
        tools: tools,
        readOnly: !isEditable,
        logLevel: 'ERROR' as LogLevels,
        onReady: () => {
          if (isEditable) new DragDrop(editor);
        },
        onChange: () => {
          console.log(isOnChange)
          saveContentReq.run(editor);
        },
      });
      setEditor(editor);
    }

    return () => {
      if (editor) editor.destroy();
    };
  }, [data]);

  const handle = () => {
    setOnChange(false);
    console.log(isOnChange);
    // const block = (editor.blocks.getBlockByIndex(1) as BlockAPI).holder;
    // console.log(block);
    // const container = document.createElement('div');
    // container.className = 'ce-block-container';
    // const modifier = document.createElement('div');
    // modifier.className = 'ce-block-modifier';
    // const text = document.createTextNode('sss');
    // block.parentElement.append(container);
    // modifier.append(text);
    // container.append(modifier);
    // container.append(block);
  };

  return (
    <PageContainer title={data?.name}>
      <Button onClick={handle}>sdfsdf</Button>
      <ProCard>
        <div id="editorjs" />
      </ProCard>
    </PageContainer>
  );
};
export default TaskDetail;
