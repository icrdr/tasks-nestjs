import React, { useEffect, useRef, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { useLocation, useModel, useParams, useRequest } from "umi";
import { Button, Card, Spin } from "antd";
import Quill from "quill";
import * as Y from "yjs";
import { QuillBinding } from "./yquill";
import { WebsocketProvider } from "y-websocket";
// import io from "socket.io-client";

const EEE: React.FC<{}> = ({}) => {
  //editor init
  useEffect(() => {
    const options = {
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          ["image", "code-block"],
        ],
      },
      placeholder: "Compose an epic...",
      // readOnly: true,
      theme: "snow",
    };
    const quill = new Quill("#editor", options);

    // A Yjs document holds the shared data
    const ydoc = new Y.Doc();
    // Define a shared text type on the document
    const ytext = ydoc.getText("quill");


    // const provider = new WebrtcProvider("quill-demo-room", ydoc);
    const provider = new WebsocketProvider(
      "ws://localhost:3000",
      "quill-demo-room",
      ydoc
    );

    // "Bind" the quill editor to a Yjs text type.
    const binding = new QuillBinding(ytext, quill);
    
  }, []);

  return (
    <Card style={{ padding: 10 }}>
      <div id="toolbar"></div>
      <div id="editor"></div>
    </Card>
  );
};
export default EEE;
