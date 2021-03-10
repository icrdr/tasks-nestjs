import { usePersistFn, useUnmount } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

export interface Options {
  reconnectLimit?: number;
  reconnectInterval?: number;
  manual?: boolean;
  protocols?: string | string[];
  onOpen?: (event: WebSocketEventMap['open']) => void;
  onClose?: (event: WebSocketEventMap['close']) => void;
  onMessage?: (message: WebSocketEventMap['message']) => void;
  onError?: (event: WebSocketEventMap['error']) => void;
}

export interface Result {
  latestMessage?: WebSocketEventMap['message'];
  sendMessage?: WebSocket['send'];
  disconnect?: () => void;
  connect?: () => void;
  readyState: ReadyState;
  webSocketIns?: WebSocket;
}

export default function useWebSocket(socketUrl: string, options: Options = {}): Result {
  const {
    protocols,
    reconnectLimit = 3,
    reconnectInterval = 3 * 1000,
    manual = false,
    onOpen,
    onClose,
    onMessage,
    onError,
  } = options;

  const reconnectTimesRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout>();
  const websocketRef = useRef<WebSocket>();
  const mountedRef = useRef<boolean>();

  const [latestMessage, setLatestMessage] = useState<WebSocketEventMap['message']>();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);

  /**
   * 重连
   */
  const reconnect = usePersistFn(() => {
    if (
      reconnectTimesRef.current < reconnectLimit &&
      websocketRef.current?.readyState !== ReadyState.Open
    ) {
      reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);

      reconnectTimerRef.current = setTimeout(() => {
        connectWs();
        reconnectTimesRef.current++;
      }, reconnectInterval);
    }
  });

  const connectWs = usePersistFn(() => {
    reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);

    if (websocketRef.current) {
      websocketRef.current.close();
    }

    try {
      websocketRef.current = new WebSocket(socketUrl, protocols);
      websocketRef.current.onerror = (event) => {
        reconnect();
        onError && onError(event);
        if (mountedRef.current)
          setReadyState(websocketRef.current?.readyState || ReadyState.Closed);
      };
      websocketRef.current.onopen = (event) => {
        onOpen && onOpen(event);
        reconnectTimesRef.current = 0;
        if (mountedRef.current)
          setReadyState(websocketRef.current?.readyState || ReadyState.Closed);
      };
      websocketRef.current.onmessage = (message: WebSocketEventMap['message']) => {
        onMessage && onMessage(message);
        if (mountedRef.current) setLatestMessage(message);
      };
      websocketRef.current.onclose = (event) => {
        reconnect();
        onClose && onClose(event);
        if (mountedRef.current)
          setReadyState(websocketRef.current?.readyState || ReadyState.Closed);
      };
    } catch (error) {
      throw error;
    }
  });

  /**
   * 发送消息
   * @param message
   */
  const sendMessage: WebSocket['send'] = usePersistFn((message) => {
    if (readyState === ReadyState.Open) {
      websocketRef.current?.send(message);
    } else {
      throw new Error('WebSocket disconnected');
    }
  });

  /**
   * 手动 connect
   */
  const connect = usePersistFn(() => {
    reconnectTimesRef.current = 0;
    connectWs();
  });

  /**
   * disconnect websocket
   */
  const disconnect = usePersistFn(() => {
    reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current);

    reconnectTimesRef.current = reconnectLimit;
    websocketRef.current?.close();
  });
  console.log('vvvvvv')
  useEffect(() => {
    // 初始连接
    if (!manual) {
      connect();
    }
    // FIXME: cause react clear task warming
  }, [socketUrl, manual]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      disconnect();
      mountedRef.current = false;
    };
  }, []);

  // useUnmount(() => {

  // });

  return {
    latestMessage,
    sendMessage,
    connect,
    disconnect,
    readyState,
    webSocketIns: websocketRef.current,
  };
}
