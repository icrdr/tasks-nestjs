import React, { useEffect, useRef, useState } from "react";
import { useLocation, useModel } from "umi";
import { Button, Card, Spin } from "antd";
import DragDrop from "editorjs-drag-drop";
import EditorJS, { LogLevels } from "@editorjs/editorjs";
import { Paragraph, Header, Image } from "./editorTools";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { EditorBinding } from "./EditorBinding";

const Editor: React.FC<{
  currentUser?: { id: number; username: string };
  editable?: boolean;
  loading?: boolean;
}> = ({
  currentUser = { id: 0, username: "unkown" },
  editable = false,
  loading = false,
}) => {
  const { initialState } = useModel("@@initialState");
  const { ossClient } = initialState;
  const location = useLocation() as any;
  const bindingRef = useRef<EditorBinding>();
  const editorRef = useRef<EditorJS>();
  const yDocRef = useRef<Y.Doc>();
  const [isReady, setReady] = useState(false);
  const isReadyRef = useRef<boolean>();
  isReadyRef.current = isReady
  const providerRef = useRef<WebsocketProvider>();
  const tools = {
    header: {
      class: Header,
      config: {
        levels: [1, 2, 3],
        defaultLevel: 1,
      },
      inlineToolbar: ["link"],
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
        uploader: ossClient,
      },
    },
  };

  //editor init
  useEffect(() => {
    const ydoc = new Y.Doc();
    const yArray = ydoc.getArray("editorjs");
    const editor = new EditorJS({
      holder: "editorjs",
      tools: tools,
      logLevel: "ERROR" as LogLevels,
      onReady: () => {
        if (editable) new DragDrop(editor);
      },
    });
    // wss://demos.yjs.dev
    // ws://localhost:3000
    const provider = new WebsocketProvider("ws://localhost:3000", "a3", ydoc);
    provider.on("sync", async (isSynced: boolean) => {
      if (isSynced && !isReadyRef.current) {
        await editor.isReady;
        const binding = new EditorBinding(editor, yArray);
        bindingRef.current = binding;
        await binding.isReady;
        setReady(true);
      }
    });
    yDocRef.current = ydoc;
    editorRef.current = editor;
    providerRef.current = provider;

    return () => {
      if (editorRef.current.destroy) editorRef.current.destroy();
      providerRef.current.destroy();
    };
  }, []);

  const showSaved = () => {
    console.log(
      yDocRef.current
        .getArray("editorjs")
        .toArray()
        .map((item: Y.Map<any>) => item.toJSON())
    );
  };

  return (
    <Card style={{ padding: 10 }}>
      <Button onClick={showSaved}>showSaved</Button>
      {(loading || !isReady) && <Spin />}
      <div
        id="editorjs"
        style={{ visibility: loading || !isReady ? "hidden" : "visible" }}
      ></div>
    </Card>
  );
};
export default Editor;
