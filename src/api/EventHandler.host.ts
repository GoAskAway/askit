import type { GuestToHostEventPayloads, HostToGuestEventPayloads } from 'askit/contracts';
import type { Engine } from 'rill';
import { HostHttpHandler } from './Https.host';

/**
 * 日志处理器接口，通常对应 DevToolsBridge.logMessage
 */
export type MessageLogHandler = (
  direction: 'guestToHost' | 'hostToGuest',
  event: string,
  payload: unknown,
  tabId?: string
) => void;

type AnyHandlerEntry = {
  responseEvent: keyof HostToGuestEventPayloads;
  handle: (payload: unknown, tabId?: string) => Promise<unknown>;
};

export type HandlerRegistry = Partial<Record<keyof GuestToHostEventPayloads, AnyHandlerEntry>>;

/**
 * EventHandler - 统一处理 Guest 发往 Host 的消息分发
 *
 * - Registry 模式：将分散的 if-else 收敛为注册表，易于扩展
 * - 插件化：通过 setup 注入日志回调和自定义 handler（覆盖默认）
 * - 容错：try-catch 保护，单个 Handler 崩溃不影响整体
 */
export class EventHandler {
  private static handlers: HandlerRegistry = {
    HTTP_REQUEST: {
      responseEvent: 'HTTP_RESPONSE',
      handle: (payload) =>
        HostHttpHandler.handleRequest(payload as GuestToHostEventPayloads['HTTP_REQUEST']),
    },
    // 占位实现：宿主应通过 setup 的 customHandlers 覆盖，提供真实应用信息
    GET_APP_INFO: {
      responseEvent: 'SEND_APP_INFO',
      handle: async (payload) => {
        const { requestId } = payload as GuestToHostEventPayloads['GET_APP_INFO'];
        return {
          requestId,
          appName: '',
          logo: '',
          languageContents: null,
          favoriteCount: 0,
          usedCount: 0,
          author: '',
        };
      },
    },
  };

  private static resolveHandler(
    event: string,
    customHandlers?: HandlerRegistry
  ): AnyHandlerEntry | undefined {
    const key = event as keyof GuestToHostEventPayloads;
    return customHandlers?.[key] ?? EventHandler.handlers[key];
  }

  static setup(
    engine: Engine,
    options: {
      tabId: string;
      onLog?: MessageLogHandler;
      handlers?: HandlerRegistry;
    }
  ): () => void {
    const { tabId, onLog, handlers: customHandlers } = options;

    if (!tabId) {
      console.warn('[EventHandler] No tabId provided, skipping event handler setup.');
      return () => {};
    }

    return engine.on('message', async (msg: { event: string; payload?: unknown }) => {
      const { event, payload } = msg;

      if (onLog) {
        onLog('guestToHost', event, payload, tabId);
      }

      const handler = EventHandler.resolveHandler(event, customHandlers);
      if (!handler) {
        console.warn(`[EventHandler] 无对应处理器: ${event}`);
        return;
      }

      try {
        const responsePayload = await handler.handle(payload, tabId);
        engine.sendEvent(handler.responseEvent, responsePayload);
        if (onLog) {
          onLog('hostToGuest', handler.responseEvent, responsePayload, tabId);
        }
      } catch (error) {
        console.error(`[EventHandler] 处理事件 "${event}" 时发生异常:`, error);
      }
    });
  }
}
