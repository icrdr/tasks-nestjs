import * as Y from 'yjs';
import genUUID from 'uuid/dist/v4';
import EditorJS, { BlockAPI } from '@editorjs/editorjs';
import isEqual from 'lodash/isEqual';
import xor from 'lodash/xor';
import { YArrayEvent, YMapEvent } from 'yjs';

class Mutex {
  token: boolean = true;
  run(f, g?) {
    if (this.token) {
      this.token = false;
      try {
        f();
      } finally {
        this.token = true;
      }
    } else if (g !== undefined) {
      g();
    }
  }
}

// from editor.js
const Block = {
  CSS: {
    wrapper: 'ce-block',
    wrapperStretched: 'ce-block--stretched',
    content: 'ce-block__content',
    focused: 'ce-block--focused',
    selected: 'ce-block--selected',
    dropTarget: 'ce-block--drop-target',
  },
};

type changeType = 'insert' | 'delete' | 'update';
interface eEvent {
  uuid: string;
  type: changeType;
}

export class EditorBinding {
  yArray: Y.Array<any>;
  editor: EditorJS;
  holder: HTMLElement;
  mux: Mutex;
  mutexToken: boolean = true;
  isReady: Promise<void>;

  constructor(editor: EditorJS, yArray: Y.Array<any>) {
    this.editor = editor;
    this.yArray = yArray;
    this.mux = new Mutex();
    this.initialize();
    this.setYDocObserver();
    this.setEditorObserver();
  }

  getEventType(mutation: MutationRecord) {
    const isBlockElement = (e: Element | Text) =>
      e instanceof Element ? e.classList.contains(Block.CSS.wrapper) : false;
    if (!!Array.from(mutation.removedNodes).find(isBlockElement)) return 'delete';
    if (!!Array.from(mutation.addedNodes).find(isBlockElement)) return 'insert';
    return 'update';
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
    return this.yBlocks.find((b) => b.get('uuid') === uuid);
  }
  getElementUuid(element: HTMLElement) {
    if (!element.dataset.uuid) element.setAttribute('data-uuid', genUUID());
    return element.dataset.uuid;
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

  yarrayObserve(event: Y.YEvent) {
    const delta = event.changes.delta;
    // console.log(delta);
    let startIndex = 0;
    for (const d of delta) {
      const key = Object.keys(d)[0];
      switch (key) {
        case 'retain':
          startIndex = d[key];
          break;
        case 'insert':
          const yBlocks = d[key];
          for (const yBlock of yBlocks) {
            this.eApi.insert(yBlock.get('type'), yBlock.get('data'), null, startIndex, false);
            this.getEBlockByIndex(startIndex).holder.setAttribute('data-uuid', yBlock.get('uuid'));
            startIndex = startIndex + 1;
          }
          break;
        case 'delete':
          this.editor.blocks.delete(startIndex);
          break;
      }
    }
  }

  ymapObserve(event: Y.YEvent) {
    const yBlock = event.target as Y.Map<any>;
    const keys = event.changes.keys;
    keys.forEach((change, key) => {
      if (key === 'data') {
        switch (change.action) {
          case 'update':
            const yIndex = this.getYIndex(yBlock);
            const eBlock = this.getEBlockByIndex(yIndex);
            const e = eBlock.holder.firstChild.firstChild as HTMLElement;
            e.innerHTML = yBlock.get('data').text;
            // eBlock.call('updateInner', yBlock.get('data'));
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

  private async initialize() {
    await this.editor.isReady;
    this.holder = this.getEBlockByIndex(0).holder.parentElement.parentElement;
    console.log(`${this.yArray.length} yBlocks ready to init`);
    if (this.yArray.length) {
      this.mux.run(() => {
        this.yBlocks.forEach((yBlock, index) => {
          this.eApi.insert(yBlock.get('type'), yBlock.get('data'), null, index, false);
          this.getEBlockByIndex(index).holder.setAttribute('data-uuid', yBlock.get('uuid'));
        });
        this.eApi.delete(this.eApi.getBlocksCount() - 1);
      });
    } else {
      const uuid = genUUID();
      this.getEBlockByIndex(0).holder.setAttribute('data-uuid', uuid);
      const yBlock = new Y.Map([
        ['type', 'paragraph'],
        ['data', { text: '' }],
        ['uuid', uuid],
      ]);
      this.yApi.insert(0, [yBlock]);
    }
  }

  private async setYDocObserver() {
    await this.editor.isReady;
    this.yArray.observeDeep((event) => {
      console.log(`Y=>E state:${this.mux.token && this.mutexToken}`);
      this.mux.run(() => {
        this.mutexToken = false;
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

    editorObserver.observe(this.holder.querySelector('.codex-editor__redactor'), {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    });
  }

  getMutatedBlock(mutation: MutationRecord, type: changeType): HTMLElement {
    const WrapperClass = '.' + Block.CSS.wrapper;
    switch (type) {
      case 'insert':
        return Array.from(mutation.addedNodes).find((e: Element) =>
          e.classList.contains(Block.CSS.wrapper),
        ) as HTMLElement;
      case 'delete':
        return Array.from(mutation.removedNodes).find((e: Element) =>
          e.classList.contains(Block.CSS.wrapper),
        ) as HTMLElement;
      case 'update':
        const e = mutation.target;
        if (e instanceof Text) return e.parentElement?.closest(WrapperClass);
        if (e instanceof Element) return e.querySelector(WrapperClass) || e.closest(WrapperClass);
    }
  }

  private mutationHandler(mutationList: MutationRecord[]): void {
    /**
     * We divide two Mutation types:
     * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
     * 2) functional changes. On each client actions we set functional identifiers to interact with user
     */
    const events = new Set<eEvent>();

    mutationList.map((mutation) => {
      const type = this.getEventType(mutation);
      const blockElement = this.getMutatedBlock(mutation, type);
      // console.log(`${type}: ${blockElement}`);
      switch (mutation.type) {
        case 'childList':
        case 'characterData':
          if (blockElement) {
            const uuid = this.getElementUuid(blockElement);
            events.add({ uuid, type });
          }
          break;
        case 'attributes':
          const target = mutation.target as Element;
          if (target.classList.contains(Block.CSS.wrapper)) break;
          if (blockElement) {
            const uuid = this.getElementUuid(blockElement);
            events.add({ uuid, type });
          }
          break;
      }
    });
    this.eEventCallback(events);
  }

  private async eEventCallback(events: Set<eEvent>) {
    for await (const { uuid, type } of events) {
      console.log(`E=>Y state:${this.mux.token && this.mutexToken}`);
      if (!this.mutexToken) {
        this.mutexToken = true;
        continue;
      }
      const eBlock = this.getEBlockByUuid(uuid);
      const eIndex = eBlock ? this.getEIndex(eBlock) : undefined;
      const savedData = eBlock ? await eBlock.save() : undefined;
      this.mux.run(() => {
        console.log(`${type}: ${uuid}`);
        const yBlock =
          this.getYBlockByUuid(uuid) ||
          new Y.Map([
            ['type', savedData['tool']],
            ['data', savedData['data']],
            ['uuid', uuid],
          ]);
        switch (type) {
          case 'insert':
            this.yArray.insert(eIndex, [yBlock]);
            break;
          case 'delete':
            this.yArray.delete(this.getYIndex(yBlock));
            break;
          case 'update':
            yBlock.set('data', savedData['data']);
            break;
        }
      });
    }
  }
}
