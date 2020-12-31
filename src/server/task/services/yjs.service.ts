import { Inject, Injectable } from '@nestjs/common';
import { TaskService } from './task.service';
import * as Y from 'yjs';
import { debounce } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const encoding = require('lib0/dist/encoding.cjs');
const decoding = require('lib0/dist/decoding.cjs');
const mutex = require('lib0/dist/mutex.cjs');
const map = require('lib0/dist/map.cjs');
const syncProtocol = require('y-protocols/dist/sync.cjs');
const awarenessProtocol = require('y-protocols/dist/awareness.cjs');

const CALLBACK_DEBOUNCE_WAIT = 2000;
const CALLBACK_DEBOUNCE_MAXWAIT = 10000;

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const wsReadyStateClosing = 2;
const wsReadyStateClosed = 3;

// disable gc when using snapshots!
const gcEnabled = true;
const persistenceDir = process.env.Y_PERSISTENCE_DIR;

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
if (typeof persistenceDir === 'string') {
  console.info(`Persisting documents to ${persistenceDir}`);

  const LeveldbPersistence = require('y-leveldb').LeveldbPersistence;
  const ldb = new LeveldbPersistence(persistenceDir);
  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      ydoc.on('update', (update) => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async (docName, ydoc) => {},
  };
}

export class WSSharedDoc extends Y.Doc {
  name: string;
  mux: any;
  clients: Map<Object, Set<number>>;
  awareness?: any;
  constructor(name: string) {
    super({ gc: gcEnabled });
    this.name = name;
    this.mux = mutex.createMutex();
    this.clients = new Map<Object, Set<number>>();
  }
}

@Injectable()
export class YjsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private taskService: TaskService,
    private configService: ConfigService,
  ) {}

  callbackHandler(update: any, origin: any, doc: WSSharedDoc) {
    const taskId = parseInt(doc.name.split('-')[1]);
    const blocks = doc
      .getArray('editorjs')
      .toArray()
      .map((i: Y.Map<any>) => i.toJSON());

    this.logger.info(`wsUpdate on ${taskId}`);
    this.taskService.updateTaskContent(taskId, { blocks: blocks });
  }

  updateHandler(update: Uint8Array, origin: any, doc: WSSharedDoc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    doc.clients.forEach((_, client) => this.send(doc, client, message));
  }

  getYDoc(docname: string, gc: boolean = true): WSSharedDoc {
    return map.setIfUndefined(docs, docname, () => {
      const doc = new WSSharedDoc(docname);
      doc.gc = gc;
      doc.awareness = new awarenessProtocol.Awareness(doc);
      doc.awareness.setLocalState(null);
      doc.awareness.on('update', this.awarenessChangeHandler.bind(this, doc));
      doc.on('update', this.updateHandler.bind(this));
      doc.on(
        'update',
        debounce(this.callbackHandler.bind(this), CALLBACK_DEBOUNCE_WAIT, {
          maxWait: CALLBACK_DEBOUNCE_MAXWAIT,
        }),
      );
      if (persistence !== null) {
        persistence.bindState(docname, doc);
      }
      docs.set(docname, doc);
      return doc;
    });
  }

  setupWSConnection = (
    client: any,
    data: any,
    { docName = data.url.slice(1).split('?')[0], gc = true }: any = {},
  ) => {
    client.binaryType = 'arraybuffer';
    // get doc, initialize if it does not exist yet
    console.log(docName);
    const doc = this.getYDoc(docName, gc);
    doc.clients.set(client, new Set());
    // listen and reply to events
    client.on('message', (message: ArrayBuffer) => {
      if(typeof message === 'object'){
        this.messageListener(client, doc, new Uint8Array(message));
      }
    });

    // Check if clientection is still alive
    let pongReceived = true;
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        if (doc.clients.has(client)) {
          this.closeConn(doc, client);
        }
        clearInterval(pingInterval);
      } else if (doc.clients.has(client)) {
        pongReceived = false;
        try {
          client.ping();
        } catch (e) {
          this.closeConn(doc, client);
          clearInterval(pingInterval);
        }
      }
    }, pingTimeout);
    client.on('close', () => {
      this.closeConn(doc, client);
      clearInterval(pingInterval);
    });
    client.on('pong', () => {
      pongReceived = true;
    });
    // put the following in a variables in a block so the interval handlers don't keep in in
    // scope
    {
      // send sync step 1
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeSyncStep1(encoder, doc);
      this.send(doc, client, encoding.toUint8Array(encoder));
      const awarenessStates = doc.awareness.getStates();
      if (awarenessStates.size > 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageAwareness);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(
            doc.awareness,
            Array.from(awarenessStates.keys()),
          ),
        );
        this.send(doc, client, encoding.toUint8Array(encoder));
      }
    }
  };

  messageListener(client: any, doc: WSSharedDoc, message: Uint8Array) {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, null);
        if (encoding.length(encoder) > 1) {
          this.send(doc, client, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          client,
        );
        break;
      }
    }
  }

  closeConn(doc: WSSharedDoc, client: any) {
    if (doc.clients.has(client)) {
      const controlledIds: controlledIds = doc.clients.get(client);
      doc.clients.delete(client);
      awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null);
      if (doc.clients.size === 0 && persistence !== null) {
        // if persisted, we store state and destroy ydocument
        persistence.writeState(doc.name, doc).then(() => {
          doc.destroy();
        });
        docs.delete(doc.name);
      }
    }
    client.close();
  }

  send(doc: WSSharedDoc, client: any, m: Uint8Array) {
    if (client.readyState !== wsReadyStateConnecting && client.readyState !== wsReadyStateOpen) {
      this.closeConn(doc, client);
    }
    try {
      client.send(m, (err: any) => {
        err != null && this.closeConn(doc, client);
      });
    } catch (e) {
      this.closeConn(doc, client);
    }
  }

  awarenessChangeHandler(
    doc: WSSharedDoc,
    { added, updated, removed }: changeTypes,
    client: Object | null,
  ) {
    const changedClients = added.concat(updated, removed);
    if (client !== null) {
      const clientControlledIDs: controlledIds = doc.clients.get(client);
      if (clientControlledIDs !== undefined) {
        added.forEach((clientID) => {
          clientControlledIDs.add(clientID);
        });
        removed.forEach((clientID) => {
          clientControlledIDs.delete(clientID);
        });
      }
    }
    // broadcast awareness update
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, changedClients),
    );
    const buff = encoding.toUint8Array(encoder);
    doc.clients.forEach((_, c) => {
      this.send(doc, c, buff);
    });
  }
}
