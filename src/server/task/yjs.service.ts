import { ForbiddenException, Injectable } from "@nestjs/common";
import { EntityManager, In, IsNull, Not } from "typeorm";
import { TaskService } from "./task.service";
import * as Y from "yjs";
import { debounce } from "lodash";
import { parse } from "dotenv/types";
import { ConfigService } from "@nestjs/config";

const encoding = require("lib0/dist/encoding.cjs");
const decoding = require("lib0/dist/decoding.cjs");
const mutex = require("lib0/dist/mutex.cjs");
const map = require("lib0/dist/map.cjs");
const syncProtocol = require("y-protocols/dist/sync.cjs");
const awarenessProtocol = require("y-protocols/dist/awareness.cjs");

const CALLBACK_DEBOUNCE_WAIT = 2000;
const CALLBACK_DEBOUNCE_MAXWAIT = 10000;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2;
const wsReadyStateClosed = 3;

// disable gc when using snapshots!
const gcEnabled = true;
const persistenceDir = process.env.Y_PERSISTENCE_DIR

const messageSync = 0;
const messageAwareness = 1;
const messageAuth = 2;

const pingTimeout = 30000;

type changeTypes = {
  added: number[];
  updated: number[];
  removed: number[];
};
type persistence = {
  bindState: (arg0: string, doc: WSSharedDoc) => void;
  writeState: (arg0: string, doc: WSSharedDoc) => Promise<any>;
  provider: any;
} | null;

type controlledIds = Set<number>;

const docs = new Map<string, WSSharedDoc>();
let persistence: persistence = null;
if (typeof persistenceDir === "string") {
  console.info(`Persisting documents to ${persistenceDir}`);

  const LeveldbPersistence = require("y-leveldb").LeveldbPersistence;
  const ldb = new LeveldbPersistence(persistenceDir);
  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      ydoc.on("update", (update) => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async (docName, ydoc) => {},
  };
}

export class WSSharedDoc extends Y.Doc {
  name: string;
  mux: any;
  conns: Map<Object, Set<number>>;
  awareness?: any;
  constructor(name: string) {
    super({ gc: gcEnabled });
    this.name = name;
    this.mux = mutex.createMutex();
    this.conns = new Map<Object, Set<number>>();
  }
}

@Injectable()
export class YjsService {
  constructor(
    private taskService: TaskService,
    private configService: ConfigService
  ) {}

  callbackHandler(update: any, origin: any, doc: WSSharedDoc) {
    const taskId = parseInt(doc.name.split("-")[1]);
    const blocks = doc
      .getArray("editorjs")
      .toArray()
      .map((i: Y.Map<any>) => i.toJSON());
    console.log(blocks);
    this.taskService.updateTask(taskId, { blocks: blocks });
  }

  updateHandler(update: Uint8Array, origin: any, doc: WSSharedDoc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    doc.conns.forEach((_, conn) => this.send(doc, conn, message));
  }

  getYDoc(docname: string, gc: boolean = true): WSSharedDoc {
    

    return map.setIfUndefined(docs, docname, () => {
      const doc = new WSSharedDoc(docname);
      doc.gc = gc;
      doc.awareness = new awarenessProtocol.Awareness(doc);
      doc.awareness.setLocalState(null);
      doc.awareness.on("update", this.awarenessChangeHandler.bind(this, doc));
      doc.on("update", this.updateHandler.bind(this));
      doc.on(
        "update",
        debounce(this.callbackHandler.bind(this), CALLBACK_DEBOUNCE_WAIT, {
          maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
        })
      );
      if (persistence !== null) {
        persistence.bindState(docname, doc);
      }
      docs.set(docname, doc);
      return doc;
    });
  }

  setupWSConnection = (
    conn: any,
    req: any,
    { docName = req.url.slice(1).split("?")[0], gc = true }: any = {}
  ) => {
    conn.binaryType = "arraybuffer";
    // get doc, initialize if it does not exist yet
    const doc = this.getYDoc(docName, gc);
    doc.conns.set(conn, new Set());
    // listen and reply to events
    conn.on("message", (message: ArrayBuffer) =>
      this.messageListener(conn, doc, new Uint8Array(message))
    );

    // Check if connection is still alive
    let pongReceived = true;
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        if (doc.conns.has(conn)) {
          this.closeConn(doc, conn);
        }
        clearInterval(pingInterval);
      } else if (doc.conns.has(conn)) {
        pongReceived = false;
        try {
          conn.ping();
        } catch (e) {
          this.closeConn(doc, conn);
          clearInterval(pingInterval);
        }
      }
    }, pingTimeout);
    conn.on("close", () => {
      this.closeConn(doc, conn);
      clearInterval(pingInterval);
    });
    conn.on("pong", () => {
      pongReceived = true;
    });
    // put the following in a variables in a block so the interval handlers don't keep in in
    // scope
    {
      // send sync step 1
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);
      this.send(doc, conn, encoding.toUint8Array(encoder));
      const awarenessStates = doc.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            doc.awareness,
            Array.from(awarenessStates.keys())
          )
        );
        this.send(doc, conn, encoding.toUint8Array(encoder));
      }
    }
  };

  messageListener(conn: any, doc: WSSharedDoc, message: Uint8Array) {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, null);
        if (encoding.length(encoder) > 1) {
          this.send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      }
    }
  }

  closeConn(doc: WSSharedDoc, conn: any) {
    if (doc.conns.has(conn)) {
      const controlledIds: controlledIds = doc.conns.get(conn);
      doc.conns.delete(conn);
      awarenessProtocol.removeAwarenessStates(
        doc.awareness,
        Array.from(controlledIds),
        null
      );
      if (doc.conns.size === 0 && persistence !== null) {
        // if persisted, we store state and destroy ydocument
        persistence.writeState(doc.name, doc).then(() => {
          doc.destroy();
        });
        docs.delete(doc.name);
      }
    }
    conn.close();
  }

  send(doc: WSSharedDoc, conn: any, m: Uint8Array) {
    if (
      conn.readyState !== wsReadyStateConnecting &&
      conn.readyState !== wsReadyStateOpen
    ) {
      this.closeConn(doc, conn);
    }
    try {
      conn.send(m, (err: any) => {
        err != null && this.closeConn(doc, conn);
      });
    } catch (e) {
      this.closeConn(doc, conn);
    }
  }

  awarenessChangeHandler(
    doc: WSSharedDoc,
    { added, updated, removed }: changeTypes,
    conn: Object | null
  ) {
    const changedClients = added.concat(updated, removed);
    if (conn !== null) {
      const connControlledIDs: controlledIds = doc.conns.get(conn);
      if (connControlledIDs !== undefined) {
        added.forEach((clientID) => {
          connControlledIDs.add(clientID);
        });
        removed.forEach((clientID) => {
          connControlledIDs.delete(clientID);
        });
      }
    }
    // broadcast awareness update
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, changedClients)
    );
    const buff = encoding.toUint8Array(encoder);
    doc.conns.forEach((_, c) => {
      this.send(doc, c, buff);
    });
  }
}
