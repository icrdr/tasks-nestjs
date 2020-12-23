import * as Y from "yjs";
import genUUID from "uuid/dist/v4";
import EditorJS, { BlockAPI } from "@editorjs/editorjs";
import isEqual from "lodash/isEqual";
import xor from "lodash/xor";
import { createMutex } from "lib0/mutex.js";
import { YArrayEvent, YMapEvent } from "yjs";

// from editor.js
const Block = {
  CSS: {
    wrapper: "ce-block",
    wrapperStretched: "ce-block--stretched",
    content: "ce-block__content",
    focused: "ce-block--focused",
    selected: "ce-block--selected",
    dropTarget: "ce-block--drop-target",
  },
};
type changeType = "insert" | "delete" | "update";
interface changedBlock {
  uuid: string;
  type: changeType;
}
function getChangeType(mutation: MutationRecord) {
  const isBlockElement = (e: Element | Text) =>
    e instanceof Element ? e.classList.contains(Block.CSS.wrapper) : false;
  if (!!Array.from(mutation.removedNodes).find(isBlockElement)) return "delete";
  if (!!Array.from(mutation.addedNodes).find(isBlockElement)) return "insert";
  return "update";
}

export class EditorBinding {
  yArray: Y.Array<any>;

  holder: HTMLElement;

  editor: EditorJS;

  mux: any;

  eyMap: Map<string, { eBlock: BlockAPI; yBlock: Y.Map<any> }> = new Map();

  theBlock: BlockAPI;
  constructor(editor: EditorJS, holder: HTMLElement, yArray: Y.Array<any>) {
    this.holder = holder;
    this.editor = editor;
    this.yArray = yArray;
    this.mux = createMutex();
    this.setYDocObserver();
    this.setEditorObserver();
  }
  getYBlock(index: number) {
    return this.yArray.get(index) as Y.Map<any>;
  }

  getEBlock(index: number) {
    return this.editor.blocks.getBlockByIndex(index) as BlockAPI;
  }

  getEIndex(eBlock: BlockAPI) {
    return this.eBlocks.findIndex((b) => b.holder === eBlock.holder);
  }
  getYIndex(yBlock: Y.Map<any>) {
    return this.yBlocks.indexOf(yBlock);
  }
  get eApi() {
    return this.editor.blocks;
  }
  get yApi() {
    return this.yArray;
  }
  get yBlocks() {
    return this.yArray.toArray() as Y.Map<any>[];
  }
  get eBlocks() {
    const blockCount = this.editor.blocks.getBlocksCount();
    const blocks = [];
    for (let i = 0; i < blockCount; i += 1) {
      blocks.push(this.editor.blocks.getBlockByIndex(i));
    }
    return blocks as BlockAPI[];
  }

  // yarrayObserve2() {
  //   const docArr = this.yArray.toArray();
  //   add or delete
  //   const changedIds = xor(
  //     docArr.map((yBlock) => yBlock.get('uuid')),
  //     [...this.mapping.keys()],
  //   );
  //   changedIds.forEach((uuid) => {
  //     console.log(uuid);
  //     if (true) {
  //       // del an item
  //       this.editor.blocks.delete(index);
  //     } else {
  //       // add an item
  //       const yBlock = docArr.find((b) => b.uuid === uuid);
  //       const index = docArr.indexOf(yBlock);
  //       this.editor.blocks.insert(yBlock.type, yBlock.data, null, index, false);
  //       const blockApi = this.editor.blocks.getBlockByIndex(index);
  //     }
  //   });
  // }

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
            const uuid = ymap.get("uuid");
            this.editor.blocks.insert(
              ymap.get("type"),
              ymap.get("data"),
              null,
              startIndex,
              false
            );
            const blockApi = this.editor.blocks.getBlockByIndex(startIndex);
            startIndex = startIndex + 1;
          }
          break;
        case "delete":
          const uuid = this.yArray.get(startIndex).get("uuid");
          this.editor.blocks.delete(startIndex);
          break;
        default:
          break;
      }
    }
  }

  ymapObserve(event: Y.YEvent) {
    const ymap = event.target as Y.Map<any>;
    const keys = event.changes.keys;
    keys.forEach((change, key) => {
      if (key === "data") {
        switch (change.action) {
          case "update":
            const index = this.yArray.toArray().indexOf(ymap);
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
          // this.ymapObserve(event);
          break;
        default:
          break;
      }
    }
  }

  private async setYDocObserver() {
    await this.editor.isReady;
    console.log(`${this.yArray.length} ready to build`);
    if (this.yArray.length) {
      this.yBlocks.forEach((yBlock, index) => {
        this.eApi.insert(
          yBlock.get("type"),
          yBlock.get("data"),
          null,
          index,
          false
        );
      });
      this.eApi.delete(this.eApi.getBlocksCount() - 1);
    } else {
      const eBlock = this.getEBlock(0);
      const yBlock = new Y.Map();
      yBlock.set("type", "paragraph");
      yBlock.set("data", { text: "" });
      this.yApi.insert(0, [yBlock]);
      this.theBlock = eBlock;
      this.eyMap.set(JSON.stringify(eBlock.holder), { eBlock, yBlock });
    }

    this.yArray.observeDeep((event) => {
      this.mux(() => {
        console.log(event);
        this.yObserve(event);
      });
    });
  }

  private async setEditorObserver() {
    await this.editor.isReady;
    const editorObserver = new MutationObserver((mutationList, observer) => {
      this.mutationHandler(mutationList);
    });
    editorObserver.observe(
      this.holder.querySelector(".codex-editor__redactor"),
      {
        childList: true,
        attributes: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true,
      }
    );
  }

  getMutatedBlock(mutation: MutationRecord, type: changeType): HTMLElement {
    const WrapperClass = "." + Block.CSS.wrapper;
    switch (type) {
      case "insert":
        return Array.from(mutation.addedNodes).find((e: Element) =>
          e.classList.contains(Block.CSS.wrapper)
        ) as HTMLElement;
      case "delete":
        return Array.from(mutation.removedNodes).find((e: Element) =>
          e.classList.contains(Block.CSS.wrapper)
        ) as HTMLElement;
      case "update":
        const e = mutation.target;
        if (e instanceof Text) return e.parentElement?.closest(WrapperClass);
        if (e instanceof Element)
          return e.querySelector(WrapperClass) || e.closest(WrapperClass);
    }
  }

  private mutationHandler(mutationList: MutationRecord[]): void {
    /**
     * We divide two Mutation types:
     * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
     * 2) functional changes. On each client actions we set functional identifiers to interact with user
     */
    const changedBlockList = new Set<changedBlock>();

    mutationList.map((mutation) => {
      const type = getChangeType(mutation);
      const blockElement = this.getMutatedBlock(mutation, type);
      switch (mutation.type) {
        case "childList":
        case "characterData":
          if (blockElement) {
            changedBlockList.add({ uuid: JSON.stringify(blockElement), type });
          }
          break;
        case "attributes":
          const target = mutation.target as Element;
          if (target.classList.contains(Block.CSS.wrapper)) break;
          if (blockElement) {
            changedBlockList.add({ uuid: JSON.stringify(blockElement), type });
          }
          break;
      }
    });

    this.onEditorChange(changedBlockList);
  }

  private async onEditorChange(changedBlockList: Set<changedBlock>) {
    for await (const { uuid, type } of changedBlockList) {
      let { eBlock, yBlock } = this.eyMap.get(uuid);
      const eIndex = eBlock ? this.getEIndex(eBlock) : undefined;
      const yIndex = yBlock ? this.getYIndex(yBlock) : undefined;
      const savedData = eBlock ? await eBlock.save() : undefined;
      console.log(`${type}: ${uuid}`);
      this.mux(() => {
        switch (type) {
          case "insert":
            // []eyMap  [x]eBlock  []yBlock
            yBlock = new Y.Map();
            yBlock.set("type", savedData["tool"]);
            yBlock.set("data", savedData["data"]);
            this.yArray.insert(eIndex, [yBlock]);
            break;
          case "delete":
            // [x]eyMap []eBlock  [x]yBlock
            this.yArray.delete(yIndex);
            break;
          case "update":
            // [x]eyMap [x]eBlock  [x]yBlock
            yBlock = this.getYBlock(eIndex);
            yBlock.set("data", savedData["data"]);
            break;
        }
      });
    }
  }
}
