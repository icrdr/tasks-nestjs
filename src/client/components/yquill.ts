/**
 * @module bindings/quill
 */

import { createMutex } from "lib0/mutex.js";
import * as Y from "yjs"; // eslint-disable-line
import Quill from "quill";
/**
 * Removes the pending '\n's if it has no attributes.
 */
export const normQuillDelta = (delta) => {
  if (delta.length > 0) {
    const d = delta[delta.length - 1];
    const insert = d.insert;
    if (
      d.attributes === undefined &&
      insert !== undefined &&
      insert.slice(-1) === "\n"
    ) {
      delta = delta.slice();
      let ins = insert.slice(0, -1);
      while (ins.slice(-1) === "\n") {
        ins = ins.slice(0, -1);
      }
      delta[delta.length - 1] = { insert: ins };
      if (ins.length === 0) {
        delta.pop();
      }
      return delta;
    }
  }
  return delta;
};


export class QuillBinding {
  mux: any;
  type: any;
  doc: any;
  quill: Quill;
  _negatedUsedFormats: any;
  _typeObserver: any;
  _quillObserver: any;
  constructor(type, quill: Quill) {
    const mux = createMutex();
    const doc = /** @type {Y.Doc} */ type.doc;
    this.mux = mux;
    this.type = type;
    this.doc = doc;
    this.quill = quill;
    // This object contains all attributes used in the quill instance
    this._negatedUsedFormats = {};

    this._typeObserver = (event) => {
      mux(() => {
        const eventDelta = event.delta;
        // We always explicitly set attributes, otherwise concurrent edits may
        // result in quill assuming that a text insertion shall inherit existing
        // attributes.
        const delta = [];
        for (let i = 0; i < eventDelta.length; i++) {
          const d = eventDelta[i];
          if (d.insert !== undefined) {
            delta.push(
              Object.assign({}, d, {
                attributes: Object.assign(
                  {},
                  this._negatedUsedFormats,
                  d.attributes || {}
                ),
              })
            );
          } else {
            delta.push(d);
          }
        }
        quill.updateContents(delta, "yjs");
      });
    };

    this._quillObserver = (eventType, delta) => {
      if (delta && delta.ops) {
        console.log('update')
        // update content
        const ops = delta.ops;
        ops.forEach((op) => {
          if (op.attributes !== undefined) {
            for (let key in op.attributes) {
              if (this._negatedUsedFormats[key] === undefined) {
                this._negatedUsedFormats[key] = false;
              }
            }
          }
        });
        mux(() => {
          type.applyDelta(ops);
        });
      }
    };

    type.observe(this._typeObserver);
    quill.on("editor-change", this._quillObserver);

    mux(() => {
      console.log(type.toDelta())
      // This indirectly initializes _negatedUsedFormats.
      // Make sure that this call this after the _quillObserver is set.
      quill.setContents(type.toDelta());
    });
  }

  destroy() {
    this.type.unobserve(this._typeObserver);
    this.quill.off("editor-change", this._quillObserver);
  }
}
