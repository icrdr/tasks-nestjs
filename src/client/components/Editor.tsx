import React, { useEffect, useRef, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { useLocation, useModel, useParams, useRequest } from "umi";
import { Button, Card, Spin } from "antd";
import DragDrop from "editorjs-drag-drop";
import EditorJS, {
  API,
  BlockAPI,
  LogLevels,
  OutputData,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import ImageTool from "@editorjs/image";
import moment from "moment";
import * as Y from "yjs";
import { MoveEvent } from "@editorjs/editorjs/types/tools";
import { WebsocketProvider } from "y-websocket";
import { createMutex } from "lib0/mutex.js";
import { YArrayEvent, YMapEvent } from "yjs";

const Editor: React.FC<{
  currentUser?: { id: number; username: string };
  content?: OutputData;
  editable?: boolean;
  loading?: boolean;
  onReady?: (editor: EditorJS) => void;
  onChange?: (editor: EditorJS) => void;
  onSaved?: (output?: OutputData) => void;
}> = ({
  currentUser = { id: 1, username: "unkown" },
  content,
  editable = false,
  loading = false,
  onReady = () => {},
  onChange = () => {},
  onSaved = () => {},
}) => {
  const { initialState } = useModel("@@initialState");
  const { ossClient } = initialState;
  const location = useLocation() as any;
  const editorRef = useRef<EditorJS>();
  const ydocRef = useRef<Y.Doc>();
  const muxRef = useRef<any>();
  const yarrayRef = useRef<Y.Array<unknown>>();
  const blockCount = useRef<number>(0);
  const [isReady, setReady] = useState(false);
  const divRef = useRef();

  class ossImageTool extends ImageTool {
    constructor({ data, config, api, readOnly, block }) {
      //call on block's creation (init editor or insert a new block)
      super({ data, config, api, readOnly, block });
      const imagePreloader = (this as ImageTool).ui.nodes.imagePreloader;
      const imageContainer = (this as ImageTool).ui.nodes.imageContainer;
      imagePreloader.className = "oss-image-tool__image-preloader";
      imageContainer.className = "oss-image-tool__image";

      const spin = document.createElement("span");
      spin.classList.add("ant-spin-dot", "ant-spin-dot-spin");
      for (let index = 0; index < 4; index++) {
        const dot = document.createElement("i");
        dot.className = "ant-spin-dot-item";
        spin.append(dot);
      }
      const contrainer = document.createElement("div");
      contrainer.className = "oss-image-tool__image-preloader-contrainer";

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
    const objectName = moment().format("YYYYMMDDhhmmss");
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

  function toolWrapper(Tool: any) {
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
      getIndex() {
        const nodes = Array.prototype.slice.call(
          this._block.holder.parentElement.children
        );
        return nodes.indexOf(this._block.holder);
      }

      save(blockContent: HTMLElement) {
        const output = super.save(blockContent);
        if (this._modifier) output["modifier"] = this._modifier;
        return output;
      }

      updateModifierUI() {
        if (this._modifier)
          this._block.holder.setAttribute("modifier", this._modifier?.username);
      }

      render() {
        this._blockContent = super.render();
        return this._blockContent;
      }

      rendered() {
        if (super.rendered) super.rendered();
        this.updateModifierUI();
        const preBlockCount = blockCount.current;
        blockCount.current = this._api.blocks.getBlocksCount();

        // console.log(this._block.config['ymap'])
        // console.log(yarrayRef.current.toArray())
        // if (preBlockCount === blockCount.current - 1 && preBlockCount !== 0) {
        //   muxRef.current(() => {
        //     const currentIndex = this._api.blocks.getCurrentBlockIndex();
        //     this._yContent.set("type", this._block.name);
        //     this._yContent.set("data", this._data);
        //     yarrayRef.current.insert(currentIndex + 1, [this._yContent]);
        //   });
        // }

        muxRef.current(() => {
          if (!yarrayRef.current) return;
          const index = this.getIndex();
          const ymap = new Y.Map();
          ymap.set("type", this._block.name);
          ymap.set("data", this.data);
          const beforeCount = yarrayRef.current.toArray().length;
          yarrayRef.current.insert(index, [ymap]);
          const afterCount = yarrayRef.current.toArray().length;
          console.log(
            `No.${index} on creation: ${beforeCount} -> ${afterCount}`
          );
        });
      }
      updateInner(data) {
        // console.log(data);
        console.log(`No.${this.getIndex()} updating`);
        this._blockContent.innerHTML = data.text;
      }

      updated() {
        if (super.updated) super.updated();
        this._modifier = currentUser;
        this.updateModifierUI();
        console.log(`No.${this.getIndex()} updated`);
        const newContent = this.save(this._blockContent);
        muxRef.current(() => {
          const index = this.getIndex();
          const ymap = yarrayRef.current.toArray()[index] as Y.Map<any>;
          ymap.set("data", newContent);
        });
      }

      moved(event: MoveEvent) {
        if (super.moved) super.moved(event);
        muxRef.current(() => {
          let fromIndex = event.detail.fromIndex;
          let toIndex = event.detail.toIndex;
          const theBlock = yarrayRef.current.get(fromIndex);
          if (fromIndex < toIndex) toIndex = toIndex + 1;
          yarrayRef.current.insert(toIndex, [theBlock]);
          if (fromIndex > toIndex) fromIndex = fromIndex + 1;
          yarrayRef.current.delete(fromIndex);
        });
      }

      removed() {
        if (super.removed) super.removed();
        blockCount.current = this._api.blocks.getBlocksCount() - 1;
        const currentIndex = this._api.blocks.getCurrentBlockIndex();

        muxRef.current(() => {
          const beforeCount = yarrayRef.current.toArray().length;
          yarrayRef.current.delete(currentIndex - 1, 1);
          const afterCount = yarrayRef.current.toArray().length;
          console.log(
            `No.${currentIndex} on deletion: ${beforeCount} -> ${afterCount}`
          );
        });

        //fix preBlock is not focus after deletion on mobile.
        if (currentIndex === 0) return;
        const preBlock = this._api.blocks.getBlockByIndex(
          currentIndex - 1
        ) as BlockAPI;
        (preBlock?.holder.firstChild.firstChild as HTMLElement).focus();
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
      inlineToolbar: ["link"],
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

  const yarrayObserve = (event: Y.YEvent) => {
    const delta = event.changes.delta;
    console.log(delta);
    let startIndex = 0;
    for (const d of delta) {
      const key = Object.keys(d)[0];
      switch (key) {
        case "retain":
          startIndex = d[key];
          break;
        case "insert":
          const ymaps = d[key];
          for (const ymap of ymaps) {
            editorRef.current.blocks.insert(
              ymap.get("type"),
              ymap.get("data"),
              {},
              startIndex
            );
            console.log(yarrayRef.current.length)
            startIndex = startIndex + 1;
          }

          break;
        case "delete":
          editorRef.current.blocks.delete(startIndex + 1);
          break;
        default:
          break;
      }
    }
  };
  const ymapObserve = (event: Y.YEvent) => {
    const ymap = event.target as Y.Map<any>;
    const keys = event.changes.keys;
    keys.forEach((change, key) => {
      if (key === "data") {
        switch (change.action) {
          case "update":
            const index = yarrayRef.current.toArray().indexOf(ymap);
            const block = editorRef.current.blocks.getBlockByIndex(
              index
            ) as BlockAPI;
            block.call("updateInner", ymap.get("data"));

            break;
          default:
            break;
        }
      }
    });
  };
  const yObserve = (events: Y.YEvent[]) => {
    for (const event of events) {
      switch (event.constructor) {
        case YArrayEvent:
          yarrayObserve(event);
          break;
        case YMapEvent:
          ymapObserve(event);
          break;
        default:
          break;
      }
    }
  };

  const initYdoc = () => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:3000",
      "demo-room",
      ydoc
    );
    const yarray = ydoc.getArray("editorjs");

    yarray.observeDeep((events) => {
      muxRef.current(() => {
        yObserve(events);
      });
    });

    ydocRef.current = ydoc;
    yarrayRef.current = yarray;
  };
  //editor init
  useEffect(() => {
    muxRef.current = createMutex();
    const _editor = new EditorJS({
      holder: "editorjs",
      tools: tools,
      readOnly: !editable,
      logLevel: "ERROR" as LogLevels,
      onReady: () => {
        if (!divRef.current) return;
        if (editable) new DragDrop(editorRef.current);
        setReady(true);
        initYdoc();
        onReady(editorRef.current);
      },
      onChange: () => {
        onChange(editorRef.current);
        editorRef.current.saver.save().then((res) => {
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

  const handle = () => {
    console.log(yarrayRef.current.toArray().map((item) => item.toJSON()));
    // editorRef.current.blocks.insert("paragraph", { text: "ssssss" }, {}, 0);
  };
  return (
    <Card style={{ padding: 10 }}>
      {(loading || !isReady) && <Spin />}
      <Button onClick={handle}>sdfsefsefasefe</Button>
      <div
        ref={divRef}
        id="editorjs"
        style={{ visibility: loading || !isReady ? "hidden" : "visible" }}
      ></div>
    </Card>
  );
};
export default Editor;
