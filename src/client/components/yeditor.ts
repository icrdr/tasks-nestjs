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
import OSS from "ali-oss";

class ossImageTool extends ImageTool {
  ossClient: OSS;
  constructor({ data, config, api, readOnly, block }) {
    //call on block's creation (init editor or insert a new block)
    super({ data, config, api, readOnly, block });
    this.ossClient = config.ossClient;
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

// const uploadByFile = async (file: any) => {
//   const objectName = moment().format('YYYYMMDDhhmmss');
//   const res = await ossClient.put(objectName, file);
//   console.log(res);
//   return {
//     success: 1,
//     file: {
//       ossObject: objectName,
//     },
//   };
// };

// const uploadByUrl = (url: string) => {
//   return new Promise(function (resolve, reject) {
//     resolve({
//       success: 1,
//       file: {
//         url: url,
//       },
//     });
//   });
// };

export class Yeditor {
  editor: EditorJS;
  ydoc: Y.Doc;
  yarray: Y.Array<any>;
  mux: any;
  wsCount: number = 0;
  blockCount: number = 0;
  isReady: boolean = false;
  constructor(
    {
      holder,
      editable,
      currentUser,
    }: { holder?: string; editable?: boolean; currentUser?: any } = {
      holder: "editorjs",
      editable: true,
    }
  ) {
    this.mux = createMutex();
    this.ydoc = new Y.Doc();
    this.yarray = this.ydoc.getArray("editorjs");
    const self = this;
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
            this._block.holder.setAttribute(
              "modifier",
              this._modifier?.username
            );
        }

        render() {
          this._blockContent = super.render();
          return this._blockContent;
        }

        rendered() {
          if (super.rendered) super.rendered();
          this.updateModifierUI();
          const preBlockCount = self.blockCount;
          self.blockCount = this._api.blocks.getBlocksCount();
          const nowBlockCount = self.blockCount;
          // console.log(preBlockCount);
          // console.log(this._api.blocks.getBlocksCount());
          if (self.isReady) {
            self.mux(() => {
              const currentIndex = this._api.blocks.getCurrentBlockIndex();
              const index = this.getIndex();
              const count = this._api.blocks.getBlocksCount();
              const needExtraInsert =
                currentIndex === 0 &&
                self.yarray.toArray().length === 0 &&
                index === 0 &&
                count === 2;

              if (needExtraInsert) {
                const ymap = new Y.Map();
                ymap.set("type", "paragraph");
                ymap.set("data", { text: "" });
                self.yarray.insert(0, [ymap]);
              }
              const ymap = new Y.Map();
              ymap.set("type", this._block.name);
              ymap.set("data", this.data);
              const beforeCount = self.yarray.toArray().length;
              self.yarray.insert(index, [ymap]);
              const afterCount = self.yarray.toArray().length;
              console.log(
                `No.${index} on creation: ${beforeCount} -> ${afterCount}`
              );

              // if (!needExtraInsert) {
              //   const preBlock = this._api.blocks.getBlockByIndex(
              //     index - 1
              //   ) as BlockAPI;
              //   if (preBlock) preBlock.call("updateY");
              // }
            });
          }
        }
        updateInner(data) {
          // console.log(data);
          console.log(`No.${this.getIndex()} updating`);
          this._blockContent.innerHTML = data.text;
        }

        updateY() {
          const newContent = this.save(this._blockContent);
          const index = this.getIndex();
          const ymap = self.yarray.toArray()[index];
          ymap.set("data", newContent);
        }

        updated() {
          if (!this._block.holder.parentElement) return;
          if (super.updated) super.updated();
          this._modifier = currentUser;
          this.updateModifierUI();
          const index = this.getIndex();
          const currentIndex = this._api.blocks.getCurrentBlockIndex();
          if (index !== currentIndex) return;
          self.mux(() => {
            console.log(`No.${index} updated`);
            let ymap: Y.Map<any>;
            if (index >= self.yarray.toArray().length) {
              ymap = new Y.Map();
              ymap.set("type", "paragraph");
              self.yarray.insert(0, [ymap]);
            } else {
              ymap = self.yarray.toArray()[index];
            }
            const newContent = this.save(this._blockContent);
            ymap.set("data", newContent);
          });
        }

        moved(event: MoveEvent) {
          console.log('moved')
          if (super.moved) super.moved(event);
          self.mux(() => {
            let fromIndex = event.detail.fromIndex;
            let toIndex = event.detail.toIndex;
            // const theBlock = self.yarray.get(fromIndex);
            // if (fromIndex < toIndex) toIndex = toIndex + 1;
            // self.yarray.insert(toIndex, [theBlock]);
            // if (fromIndex > toIndex) fromIndex = fromIndex + 1;
            // self.yarray.delete(fromIndex);
          });
        }

        removed() {
          console.log('remove')
          if (super.removed) super.removed();
          this.blockCount = this._api.blocks.getBlocksCount() - 1;
          const currentIndex = this._api.blocks.getCurrentBlockIndex();

          self.mux(() => {
            const count = this._api.blocks.getBlocksCount();
            const cancelDeletion =
              currentIndex === 0 &&
              self.yarray.toArray().length === 0 &&
              count === 1;
            if (cancelDeletion) return;
            const beforeCount = self.yarray.toArray().length;
            self.yarray.delete(currentIndex);
            const afterCount = self.yarray.toArray().length;
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
        class: toolWrapper(Header, currentUser),
        config: {
          levels: [1, 2, 3],
          defaultLevel: 1,
        },
        inlineToolbar: ["link"],
      },
      paragraph: {
        class: toolWrapper(Paragraph, currentUser),
        config: {
          preserveBlank: true,
        },
      },
      image: {
        class: toolWrapper(ossImageTool, currentUser),
        config: {
          uploader: {
            // uploadByFile,
            // uploadByUrl,
          },
        },
      },
    };

    this.editor = new EditorJS({
      holder: holder,
      tools: tools,
      readOnly: !editable,
      logLevel: "ERROR" as LogLevels,
      onReady: () => {
        if (editable) new DragDrop(this.editor);
        this.isReady = true;
        this.initYdoc();
      },
    });
  }

  initYdoc() {
    const provider = new WebsocketProvider(
      "ws://localhost:3000",
      "mytre99mnnn44",
      this.ydoc
    );

    this.yarray.observeDeep((events) => {
      this.mux(() => {
        this.yObserve(events);
      });
    });
  }

  yarrayObserve(event: Y.YEvent) {
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
            this.editor.blocks.insert(
              ymap.get("type"),
              ymap.get("data"),
              {},
              startIndex,
              false
            );
            startIndex = startIndex + 1;
          }

          break;
        case "delete":
          this.editor.blocks.delete(startIndex);
          break;
        default:
          break;
      }
    }
    if (this.wsCount === 0) {
      this.editor.blocks.delete(startIndex);
    }
    this.wsCount = this.wsCount + 1;
  }
  ymapObserve(event: Y.YEvent) {
    const ymap = event.target as Y.Map<any>;
    const keys = event.changes.keys;
    keys.forEach((change, key) => {
      if (key === "data") {
        switch (change.action) {
          case "update":
            const index = this.yarray.toArray().indexOf(ymap);
            const block = this.editor.blocks.getBlockByIndex(index) as BlockAPI;
            block.call("updateInner", ymap.get("data"));

            break;
          default:
            break;
        }
      }
    });
  }
  yObserve(events: Y.YEvent[]) {
    for (const event of events) {
      switch (event.constructor) {
        case YArrayEvent:
          this.yarrayObserve(event);
          break;
        case YMapEvent:
          this.ymapObserve(event);
          break;
        default:
          break;
      }
    }
  }
  destroy() {
    this.editor.isReady.then(async () => {
      this.editor.destroy();
    });
  }
}
