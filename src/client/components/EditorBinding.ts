import * as Y from "yjs";
import genUUID from "uuid/dist/v4";
import EditorJS, { BlockAPI } from "@editorjs/editorjs";
import { YArrayEvent, YMapEvent } from "yjs";
import { createMutex } from "lib0/mutex.js";

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

type eEventType = "insert" | "delete" | "update";
interface eEvent {
  uuid: string;
  type: eEventType;
}

export class EditorBinding {
  yArray: Y.Array<any>;
  editor: EditorJS;
  holder: HTMLElement;
  mux: any;
  // TODO: not grace way to fix EditorObserver out of y edit mutex, could be better.
  eEventLocks: Map<string, boolean> = new Map();
  isReady: Promise<[void, void, void]>;

  constructor(editor: EditorJS, yArray: Y.Array<any>) {
    this.editor = editor;
    this.yArray = yArray;
    this.mux = createMutex();
    this.isReady = Promise.all([
      this.initialize(),
      this.setYDocObserver(),
      this.setEditorObserver(),
    ]);
  }

  getEventType(mutation: MutationRecord) {
    const isBlockElement = (e: Element | Text) =>
      e instanceof Element ? e.classList.contains(Block.CSS.wrapper) : false;
    if (!!Array.from(mutation.removedNodes).find(isBlockElement))
      return "delete";
    if (!!Array.from(mutation.addedNodes).find(isBlockElement)) return "insert";
    return "update";
  }

  getYBlockByIndex(index: number) {
    return this.yArray.get(index) as Y.Map<any>;
  }

  getEBlockByIndex(index: number) {
    return this.editor.blocks.getBlockByIndex(index) as BlockAPI;
  }

  getEIndex(eBlock: BlockAPI) {
    return this.eBlocks.findIndex((b) => b.holder === eBlock.holder);
  }

  getYIndex(yBlock: Y.Map<any>) {
    return this.yBlocks.indexOf(yBlock);
  }

  getEBlockByUuid(uuid: string) {
    return this.eBlocks.find((b) => b.holder.dataset.uuid === uuid);
  }

  getYBlockByUuid(uuid: string) {
    return this.yBlocks.find((b) => b.get("uuid") === uuid);
  }
  getElementUuid(element: HTMLElement) {
    if (!element.dataset.uuid) element.setAttribute("data-uuid", genUUID());
    return element.dataset.uuid;
  }

  getMutatedBlock(mutation: MutationRecord, type: eEventType): HTMLElement {
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

  private async initialize() {
    this.holder = this.getEBlockByIndex(0).holder.parentElement.parentElement;
    console.log(`${this.yArray.length} yBlocks ready to init`);
    if (this.yArray.length) {
      this.yBlocks.forEach((yBlock, index) => {
        let offset = 0;
        const uuid = yBlock.get("uuid");
        if (uuid) {
          this.eApi.insert(
            yBlock.get("type"),
            yBlock.get("data"),
            null,
            index - offset,
            false
          );
        } else {
          this.yApi.delete(this.getYIndex(yBlock));
          offset += 1;
        }
        this.getEBlockByIndex(index).holder.setAttribute("data-uuid", uuid);
      });
      this.eApi.delete(this.eApi.getBlocksCount() - 1);
    } else {
      const uuid = genUUID();
      this.getEBlockByIndex(0).holder.setAttribute("data-uuid", uuid);
      const yBlock = new Y.Map([
        ["type", "paragraph"],
        ["data", { text: "" }],
        ["uuid", uuid],
      ]);
      this.yApi.insert(0, [yBlock]);
    }
  }

  yInsertDeleteHandler(event: Y.YEvent) {
    const delta = event.changes.delta;
    // console.log(delta);
    let startIndex = 0;
    for (const d of delta) {
      const key = Object.keys(d)[0];
      switch (key) {
        case "retain":
          startIndex = d[key];
          break;
        case "insert":
          const yBlocks = d[key];
          for (const yBlock of yBlocks) {
            const uuid = yBlock.get("uuid");
            if (!uuid) continue;
            this.eEventLocks.set(uuid, true);
            console.log(`yEvent[insert]: ${uuid}`);
            this.eApi.insert(
              yBlock.get("type"),
              yBlock.get("data"),
              null,
              startIndex,
              false
            );
            this.getEBlockByIndex(startIndex).holder.setAttribute(
              "data-uuid",
              uuid
            );
            startIndex = startIndex + 1;
            setTimeout(() => {
              this.eEventLocks.set(uuid, false);
            }, 200);
          }
          break;
        case "delete":
          const uuid = this.getEBlockByIndex(startIndex).holder.dataset.uuid;
          this.eEventLocks.set(uuid, true);
          console.log(`yEvent[delete]: ${uuid}`);
          this.editor.blocks.delete(startIndex);
          setTimeout(() => {
            this.eEventLocks.set(uuid, false);
          }, 200);
          break;
      }
    }
  }

  yUpdateHandler(event: Y.YEvent) {
    const yBlock = event.target as Y.Map<any>;
    const keys = event.changes.keys;
    keys.forEach((change, key) => {
      if (key === "data") {
        switch (change.action) {
          case "update":
            const uuid = yBlock.get("uuid");
            this.eEventLocks.set(uuid, true);
            console.log(`yEvent[update]: ${uuid}`);
            const yIndex = this.getYIndex(yBlock);
            const eBlock = this.getEBlockByIndex(yIndex);
            const data = yBlock.get("data");
            eBlock.call("updateRender", data);

            setTimeout(() => {
              this.eEventLocks.set(uuid, false);
            }, 200);
            break;
          default:
            break;
        }
      }
    });
  }

  yEventHandler(events: Y.YEvent[]) {
    for (const event of events) {
      switch (event.constructor) {
        case YArrayEvent:
          this.yInsertDeleteHandler(event);
          break;
        case YMapEvent:
          this.yUpdateHandler(event);
          break;
        default:
          break;
      }
    }
  }

  private async setYDocObserver() {
    this.yArray.observeDeep((event) => {
      this.mux(() => {
        this.yEventHandler(event);
      });
    });
  }

  private async setEditorObserver() {
    const editorObserver = new MutationObserver((mutationList, observer) => {
      this.eEventHandler(mutationList);
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

  private eEventHandler(mutationList: MutationRecord[]): void {
    /**
     * We divide two Mutation types:
     * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
     * 2) functional changes. On each client actions we set functional identifiers to interact with user
     */
    const events = new Set<eEvent>();

    mutationList.map((mutation) => {
      const type = this.getEventType(mutation);
      const blockElement = this.getMutatedBlock(mutation, type);
      switch (mutation.type) {
        case "childList":
        case "characterData":
          if (blockElement) {
            const uuid = this.getElementUuid(blockElement);
            events.add({ uuid, type });
          }
          break;
        // case 'attributes':
        //   const target = mutation.target as Element;
        //   if (target.classList.contains(Block.CSS.wrapper)) break;
        //   if (blockElement) {
        //     const uuid = this.getElementUuid(blockElement);
        //     events.add({ uuid, type });
        //   }
        //   break;
      }
    });
    this.eEventCallback(events);
  }

  private async eEventCallback(events: Set<eEvent>) {
    for await (const { uuid, type } of events) {
      if (uuid === "undefined") continue;
      if (this.eEventLocks.get(uuid)) continue;
      const eBlock = this.getEBlockByUuid(uuid);
      const eIndex = eBlock ? this.getEIndex(eBlock) : undefined;
      const savedData = eBlock ? await eBlock.save() : undefined;
      this.mux(() => {
        console.log(`eEvent[${type}]: ${uuid}`);
        const yBlock =
          this.getYBlockByUuid(uuid) ||
          new Y.Map([
            ["type", savedData["tool"]],
            ["data", savedData["data"]],
            ["uuid", uuid],
          ]);
        switch (type) {
          case "insert":
            this.yArray.insert(eIndex, [yBlock]);
            break;
          case "delete":
            this.yArray.delete(this.getYIndex(yBlock));
            break;
          case "update":
            yBlock.set("data", savedData["data"]);
            break;
        }
      });
    }
  }
}
