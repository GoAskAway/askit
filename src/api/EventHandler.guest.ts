import { useCallback, useEffect, useRef } from 'react';
import { useHostEvent, useSendToHost } from 'rill/let';
import { HostToGuestEventPayloads, GuestToHostEventPayloads } from 'askit/contracts';

type RequestPayloadWithId = {
  requestId: string;
};

type PendingRequest<TResponse> = {
  resolve: (res: TResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * 通用的宿主 API 桥接 Hook
 * 将“请求-响应”类型的事件对封装为 Promise 调用
 * 
 * @param requestEvent Guest 发送给 Host 的请求事件 (如: 'HTTP_REQUEST')
 * @param responseEvent Host 返回给 Guest 的响应事件 (如: 'HTTP_RESPONSE')
 */
export function useEventBridge<
  TReqName extends keyof GuestToHostEventPayloads,
  TResName extends keyof HostToGuestEventPayloads
>(
  requestEvent: TReqName,
  responseEvent: TResName
) {
  const send = useSendToHost();
  const pendingRequestsRef = useRef(
    new Map<string, PendingRequest<HostToGuestEventPayloads[TResName]>>()
  );
  const isDisposedRef = useRef(false);

  useEffect(() => {
    isDisposedRef.current = false;

    return () => {
      isDisposedRef.current = true;

      // 组件卸载时，主动结束当前 Hook 实例下所有未完成请求
      pendingRequestsRef.current.forEach((entry, key) => {
        clearTimeout(entry.timer);
        entry.reject(
          new Error(
            `[useHostApi] Disposed: ${String(requestEvent)} -> ${String(responseEvent)} (${key})`
          )
        );
      });
      pendingRequestsRef.current.clear();
    };
  }, [requestEvent, responseEvent]);

  // SDK 全局监听：识别特定的响应事件并分发给对应的 Promise
  useHostEvent<HostToGuestEventPayloads[TResName]>(responseEvent as any, (res) => {
    const payload = res as RequestPayloadWithId;
    const key = `${responseEvent}:${payload.requestId}`;
    const pendingRequest = pendingRequestsRef.current.get(key);

    if (pendingRequest) {
      pendingRequestsRef.current.delete(key);
      clearTimeout(pendingRequest.timer);

      // 组件已卸载时直接丢弃响应，避免继续回写到失效实例
      if (isDisposedRef.current) {
        return;
      }

      pendingRequest.resolve(res);
    }
  });

  /**
   * 发起请求并等待响应
   * @param payload 符合合约定义的请求载荷
   * @param timeoutMs 超时时间，默认 10 秒
   */
  const request = useCallback(
    async (
      payload: GuestToHostEventPayloads[TReqName],
      timeoutMs = 10000
    ): Promise<HostToGuestEventPayloads[TResName]> => {
      const { requestId } = payload as RequestPayloadWithId;
      if (!requestId) {
        throw new Error(`[useHostApi] requestId is required for ${requestEvent}`);
      }

      const key = `${responseEvent}:${requestId}`;

      return new Promise<HostToGuestEventPayloads[TResName]>((resolve, reject) => {
        if (isDisposedRef.current) {
          reject(
            new Error(
              `[useHostApi] Disposed before request: ${String(requestEvent)} -> ${String(
                responseEvent
              )} (ID: ${requestId})`
            )
          );
          return;
        }

        // 超时保护逻辑
        const timer = setTimeout(() => {
          if (pendingRequestsRef.current.has(key)) {
            pendingRequestsRef.current.delete(key);
            reject(new Error(`[useHostApi] Timeout: ${requestEvent} -> ${responseEvent} (ID: ${requestId})`));
          }
        }, timeoutMs);

        pendingRequestsRef.current.set(key, { resolve, reject, timer });

        // 实际发送底层事件
        send(requestEvent as any, payload);
      });
    },
    [send, requestEvent, responseEvent]
  );

  return { request };
}
