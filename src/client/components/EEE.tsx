import React, { useEffect, useRef, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { useLocation, useModel, useParams, useRequest } from "umi";
import { Button, Card, Spin } from "antd";
import Quill from "quill";
import * as Y from "yjs";
import { QuillBinding } from "y-quill";
import { WebsocketProvider } from "y-websocket";
// import io from "socket.io-client";

const EEE: React.FC<{}> = ({}) => {
  const wsRef = useRef<WebSocket>();

  const handleConnection = () => {
    // if (wsRef.current) wsRef.current.connect();
  };

  const handleSend = () => {
    console.log(wsRef.current);
    if (wsRef.current) wsRef.current.send('sdfasefasefasef');
  };

  //editor init
  useEffect(() => {
    // const ws = new WebSocket("ws://localhost:3000");
    // ws.onopen = () => {
    //   // on connecting, do nothing but log it to the console
    //   console.log("connected");
    // };
    // socket.on("connect", function () {
    //   console.log("[%s]on connect...", socket.id);
    // });

    // socket.on("events", function (data) {
    //   console.log("[%s]on event...", socket.id, data);
    // });

    // socket.on("news", function (data) {
    //   console.log("[%s]on news...", socket.id, data);
    //   socket.emit("events", {
    //     msg: "test",
    //     ts: new Date(),
    //   });
    // });

    // socket.on("disconnect", function () {
    //   console.log("[%s]on disconnect....", socket.id);
    // });

    // wsRef.current = ws;
  }, []);

  //editor init
  useEffect(() => {
    const options = {
      modules: {
        toolbar: "#toolbar",
      },
      placeholder: "Compose an epic...",
      // readOnly: true,
      // theme: "snow",
    };
    const quill = new Quill("#editor", options);

    // A Yjs document holds the shared data
    const ydoc = new Y.Doc();
    // Define a shared text type on the document
    const ytext = ydoc.getText("quill");

    // "Bind" the quill editor to a Yjs text type.
    const binding = new QuillBinding(ytext, quill);
    // const provider = new WebrtcProvider("quill-demo-room", ydoc);
    const wsProvider = new WebsocketProvider(
      "ws://localhost:3000",
      "quill-demo-room",
      ydoc
    );

    wsProvider.on("status", (event) => {
      console.log(wsProvider.wsconnected);

      console.log(event.status); // logs "connected" or "disconnected"
    });
  }, []);

  return (
    <Card style={{ padding: 10 }}>
      <Button onClick={handleConnection}>c</Button>
      <Button onClick={handleSend}>asefaesf</Button>
      <div id="toolbar"></div>
      <div id="editor"></div>
    </Card>
  );
};
export default EEE;
