import { Engine } from 'rill';
import { GuestToHostEventPayloads, HostToGuestEventPayloads } from 'askit/contracts';
import { HostHttpHandler } from './Https.host';

/**
 * 日志处理器接口定义，通常对应 DevToolsBridge.logMessage
 */
export type MessageLogHandler = (
  direction: 'guestToHost' | 'hostToGuest',
  event: string,
  payload: unknown,
  tabId?: string
) => void;

/**
 * 消息处理器函数类型定义
 */
type HandlerFunc<
  K extends keyof GuestToHostEventPayloads,
  V extends keyof HostToGuestEventPayloads,
> = (payload: GuestToHostEventPayloads[K], tabId?: string) => Promise<HostToGuestEventPayloads[V]>;

type HandlerEntry<
  K extends keyof GuestToHostEventPayloads,
  V extends keyof HostToGuestEventPayloads,
> = {
  responseEvent: V;
  handle: HandlerFunc<K, V>;
};

type AnyHandlerEntry<K extends keyof GuestToHostEventPayloads> = {
  [V in keyof HostToGuestEventPayloads]: HandlerEntry<K, V>;
}[keyof HostToGuestEventPayloads];

export type HandlerRegistry = Partial<{
  [K in keyof GuestToHostEventPayloads]: AnyHandlerEntry<K>;
}>;

function isRegisteredEvent(
  event: string,
  handlers: HandlerRegistry
): event is keyof GuestToHostEventPayloads {
  return event in handlers;
}

/**
 * EventHandler - 统一处理 Guest 发往 Host 的消息分发
 *
 * 优化说明：
 * 1. 结构化：将分散的 if-else 逻辑改为 Registry 模式，易于扩展和维护。
 * 2. 类型安全：严格遵循 GuestToHostEventPayloads 类型定义，减少运行时错误。
 * 3. 插件化：通过 setup 方法注入日志回调，解耦宿主 UI 与逻辑。
 * 4. 容错性：增加 try-catch 保护，防止单个 Handler 崩溃影响整个生命周期。
 */
export class EventHandler {
  /**
   * 注册的消息处理映射表
   */
  private static handlers = {
    /**
     * 网络请求 (HTTP)
     */
    HTTP_REQUEST: {
      responseEvent: 'HTTP_RESPONSE',
      handle: async (payload) => {
        const res = await HostHttpHandler.handleRequest(payload);
        return res;
      },
    },
  } satisfies HandlerRegistry;

  private static async handleKnownEvent<K extends keyof GuestToHostEventPayloads>(
    engine: Engine,
    event: K,
    payload: GuestToHostEventPayloads[K],
    tabId: string,
    onLog?: MessageLogHandler,
    customHandlers?: HandlerRegistry
  ) {
    const defaultHandlers: HandlerRegistry = this.handlers;
    const handler = customHandlers?.[event] || defaultHandlers[event];

    if (!handler) {
      console.warn(`[EventHandler] 无对应处理器: ${event}`);
      return;
    }

    const responsePayload = await handler.handle(payload, tabId);
    const responseEvent = handler.responseEvent;

    // Handler 只返回业务结果，统一由 setup 发送对应的 HostToGuest 事件。
    engine.sendEvent(responseEvent, responsePayload);

    if (onLog) {
      onLog('hostToGuest', responseEvent, responsePayload, tabId);
    }
  }

  /**
   * 初始化引擎的消息监听器
   *
   * @param engine Rill Engine 实例
   * @param options 配置参数，包括 tabId 和日志回调
   * @returns 返回一个 unsubscribe 函数用于销毁监听
   */
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
      return () => {
        /* no-op */
      };
    }

    return engine.on('message', async (msg: { event: string; payload?: unknown }) => {
      const { event, payload } = msg;

      // 1. 发送到外部日志记录器 (如 DevTools)
      if (onLog) {
        onLog('guestToHost', event, payload, tabId);
      }

      console.log(`[EventHandler] [Tab:${tabId || 'Default'}] 收到消息: ${event}`, payload);

      // 2. 匹配并执行处理器
      if (!isRegisteredEvent(event, { ...this.handlers, ...customHandlers })) {
        console.warn(`[EventHandler] 无对应处理器: ${event}`);
        return;
      }

      try {
        await this.handleKnownEvent(
          engine,
          event,
          payload as GuestToHostEventPayloads[typeof event],
          tabId,
          onLog,
          customHandlers
        );
      } catch (error) {
        console.error(`[EventHandler] 处理事件 "${event}" 时发生异常:`, error);
      }
    });
  }
}
