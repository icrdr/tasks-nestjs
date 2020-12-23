import * as Y from 'yjs';
import genUUID from 'uuid/dist/v4';
import EditorJS, { BlockAPI } from '@editorjs/editorjs';
import isEqual from 'lodash/isEqual';
import xor from 'lodash/xor';
import { createMutex } from 'lib0/mutex.js';
import { YArrayEvent, YMapEvent } from 'yjs';

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

function checkChangeType(mutation: MutationRecord) {
  const isBlockElement = (el: Element | Text) =>
    el instanceof Element ? el.classList.contains(Block.CSS.wrapper) : false;
  if (!!Array.from(mutation.removedNodes).find(isBlockElement)) return 'remove';

  if (!!Array.from(mutation.addedNodes).find(isBlockElement)) return 'add';

  return 'update';
}

export class EditorBinding {
  yArray: Y.Array<any>;

  observer: MutationObserver;

  holder: HTMLElement;

  editor: EditorJS;

  isReady: Promise<any>;

  mux: any;

  mapping = new Map<string, { blockApi: BlockAPI; yBlock: Y.Map<any> }>();

  constructor(editor: EditorJS, holder: HTMLElement, yArray: Y.Array<any>) {
    this.holder = holder;
    this.editor = editor;
    this.yArray = yArray;
    this.mux = createMutex();
    this.isReady = this.initYDoc();
    this.setObserver();
  }

  get editorBlocks() {
    const blockCount = this.editor.blocks.getBlocksCount();
    const blocks = [];
    for (let i = 0; i < blockCount; i += 1) {
      blocks.push(this.editor.blocks.getBlockByIndex(i));
    }
    return blocks;
  }

  yarrayObserve2() {
    const docArr = this.yArray.toArray();
    // add or delete
    const changedIds = xor(
      docArr.map((yBlock) => yBlock.get('uuid')),
      [...this.mapping.keys()],
    );
    changedIds.forEach((uuid) => {
      console.log(uuid);
      if (this.mapping.has(uuid)) {
        // del an item
        const { index } = this.mapping.get(uuid);
        this.mapping.delete(uuid);
        this.editor.blocks.delete(index);
      } else {
        // add an item
        const yBlock = docArr.find((b) => b.uuid === uuid);
        const index = docArr.indexOf(yBlock);
        this.editor.blocks.insert(yBlock.type, yBlock.data, null, index, false);
        const blockApi = this.editor.blocks.getBlockByIndex(index);
        blockApi.holder.setAttribute('data-block-uuid', uuid);
        this.mapping.set(uuid, { index, blockApi, yBlock });
      }
    });
  }

  yarrayObserve(event: Y.YEvent) {
    const delta = event.changes.delta;
    console.log(delta);
    let startIndex = 0;
    for (const d of delta) {
      const key = Object.keys(d)[0];
      switch (key) {
        case 'retain':
          startIndex = d[key];
          break;
        case 'insert':
          const ymaps = d[key];
          for (const ymap of ymaps) {
            const uuid = ymap.get('uuid');
            this.editor.blocks.insert(ymap.get('type'), ymap.get('data'), null, startIndex, false);
            const blockApi = this.editor.blocks.getBlockByIndex(startIndex);
            blockApi.holder.setAttribute('data-block-uuid', uuid);
            this.mapping.set(uuid, { index: startIndex, blockApi, yBlock: ymap });
            startIndex = startIndex + 1;
          }
          break;
        case 'delete':
          const uuid = this.yArray.get(startIndex).get('uuid');
          this.mapping.delete(uuid);
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
      if (key === 'data') {
        switch (change.action) {
          case 'update':
            const index = this.yArray.toArray().indexOf(ymap);
            const block = this.editor.blocks.getBlockByIndex(index) as BlockAPI;
            block.call('updateInner', ymap.get('data'));

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

  private async initYDoc() {
    await this.editor.isReady;
    console.log(this.yArray.length);
    if (this.yArray.length) {
      this.yArray.toArray().forEach((yBlock, index) => {
        this.editor.blocks.insert(yBlock.get('type'), yBlock.get('data'), null, index, false);
        const blockApi = this.editor.blocks.getBlockByIndex(index) as BlockAPI;
        blockApi.holder.setAttribute('data-block-uuid', yBlock.get('uuid'));
        this.mapping.set(yBlock.get('uuid'), { blockApi, yBlock });
      });
      const blockCount = this.editor.blocks.getBlocksCount();
      this.editor.blocks.delete(blockCount - 1);
    } else {
      const blockUuid = genUUID();
      const blockApi = this.editorBlocks[0];
      blockApi.holder.setAttribute('data-block-uuid', blockUuid);
      const savedData = (await blockApi?.save()) || {};
      const yBlock = new Y.Map();
      yBlock.set('type', 'paragraph');
      yBlock.set('data', savedData.data);
      yBlock.set('uuid', genUUID());
      this.yArray.insert(0, [yBlock]);
      this.mapping.set(blockUuid, { blockApi, yBlock });
    }

    this.yArray.observeDeep((evt, tr) => {
      this.mux(() => {
        console.log(evt);
        this.yObserve(evt);
      });
    });
  }

  private async setObserver() {
    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
    };

    this.observer = new MutationObserver((mutationList, observer) => {
      this.mutationHandler(mutationList, observer);
    });
    await this.editor.isReady;
    this.observer.observe(this.holder.querySelector('.codex-editor__redactor'), observerOptions);
  }

  private mutationHandler(mutationList: MutationRecord[], observer): void {
    /**
     * We divide two Mutation types:
     * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
     * 2) functional changes. On each client actions we set functional identifiers to interact with user
     */
    const changed = new Set();

    mutationList.forEach((mutation) => {
      const target = mutation.target as Element;
      const blockSelector = '.' + Block.CSS.wrapper;

      function findChangedBlockElement(mutation: MutationRecord, changeType): HTMLElement {
        if (changeType === 'add') {
          return Array.from(mutation.addedNodes).find((n: Element) =>
            n.classList.contains(Block.CSS.wrapper),
          ) as HTMLElement;
        }

        if (changeType === 'remove') {
          return Array.from(mutation.removedNodes).find((n: Element) =>
            n.classList.contains(Block.CSS.wrapper),
          ) as HTMLElement;
        }

        const el = mutation.target;
        if (el instanceof Text) return el.parentElement?.closest(blockSelector);

        if (el instanceof Element)
          return el.querySelector(blockSelector) || el.closest(blockSelector);

        return null;
      }

      const blockElements = Array.from(this.holder.querySelectorAll(blockSelector));
      const changeType = checkChangeType(mutation);
      switch (mutation.type) {
        case 'childList':
        case 'characterData':
          const blockElement = findChangedBlockElement(mutation, changeType);
          if (blockElement) {
            const blockUuid = blockElement.dataset.blockUuid || genUUID();

            if (!blockElement.dataset.blockUuid)
              blockElement.setAttribute('data-block-uuid', blockUuid);
            changed.add({ blockUuid, changeType });
          }
          break;
        case 'attributes':
          /**
           * Changes on Element.ce-block usually is functional
           */
          if (!target.classList.contains(Block.CSS.wrapper)) {
            const blockElement = findChangedBlockElement(mutation, changeType);
            if (blockElement) {
              const blockUuid = blockElement.dataset.blockUuid || genUUID();

              if (!blockElement.dataset.blockUuid)
                blockElement.setAttribute('data-block-uuid', blockUuid);

              changed.add({ blockUuid, changeType });
            }
            break;
          }
      }
    });

    if (changed.size > 0) {
      this.onBlockChange(changed);
    }
  }

  private async onBlockChange(changed) {
    // todo: Maybe it can be optimized here
    for await (const { blockUuid, changeType } of changed) {
      // avoid calling observerDeep handler
      const mappingItem = this.mapping.get(blockUuid);
      const blockApi = this.editorBlocks.find((b) => b.holder.dataset.blockUuid === blockUuid);
      const index = this.editorBlocks.findIndex((b) => b.holder.dataset.blockUuid === blockUuid);
      const savedData = (await blockApi?.save()) || {};
      console.log(`${changeType}: ${blockUuid}`);
      this.mux(() => {
        switch (changeType) {
          case 'add':
            if (this.mapping.has(blockUuid)) break;
            const yBlock = new Y.Map();
            yBlock.set('type', savedData.tool);
            yBlock.set('data', savedData.data);
            yBlock.set('uuid', blockUuid);
            this.yArray.insert(index, [yBlock]);
            this.mapping.set(blockUuid, { blockApi, yBlock });
            break;
          case 'remove':
            if (!this.mapping.has(blockUuid)) break;
            const rmIdx = this.yArray.toArray().indexOf(mappingItem.yBlock);
            this.yArray.delete(rmIdx);
            this.mapping.delete(blockUuid);
            break;
          case 'update':
            if (!this.mapping.has(blockUuid)) break;
            const y = this.mapping.get(blockUuid).yBlock;
            y.set('data', savedData.data);
            break;
        }
      });
    }
  }
}
