import { useCallback } from 'react';
import { useHostEvent, useSendToHost } from 'rill/let';
import { HostToGuestEventPayloads, GuestToHostEventPayloads } from 'askit/contracts';

// 全局注册表：Key 为 "ResponseEventName:requestId"
const pendingRequests = new Map<string, (res: any) => void>();

/**
 * 通用的宿主 API 桥接 Hook
 * 将“请求-响应”类型的事件对封装为 Promise 调用
 * 
 * @param requestEvent Guest 发送给 Host 的请求事件 (如: 'HTTP_REQUEST')
 * @param responseEvent Host 返回给 Guest 的响应事件 (如: 'HTTP_RESPONSE')
 */
export function useHostApi<
  TReqName extends keyof GuestToHostEventPayloads,
  TResName extends keyof HostToGuestEventPayloads
>(
  requestEvent: TReqName,
  responseEvent: TResName
) {
  const send = useSendToHost();

  // SDK 全局监听：识别特定的响应事件并分发给对应的 Promise
  useHostEvent<HostToGuestEventPayloads[TResName]>(responseEvent as any, (res) => {
    const payload = res as { requestId: string };
    const key = `${responseEvent}:${payload.requestId}`;
    const resolve = pendingRequests.get(key);
    
    if (resolve) {
      resolve(res);
      pendingRequests.delete(key);
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
      const { requestId } = payload as any;
      if (!requestId) {
        throw new Error(`[useHostApi] requestId is required for ${requestEvent}`);
      }

      const key = `${responseEvent}:${requestId}`;

      return new Promise<HostToGuestEventPayloads[TResName]>((resolve, reject) => {
        // 超时保护逻辑
        const timer = setTimeout(() => {
          if (pendingRequests.has(key)) {
            pendingRequests.delete(key);
            reject(new Error(`[useHostApi] Timeout: ${requestEvent} -> ${responseEvent} (ID: ${requestId})`));
          }
        }, timeoutMs);

        pendingRequests.set(key, (res) => {
          clearTimeout(timer);
          resolve(res);
        });

        // 实际发送底层事件
        send(requestEvent as any, payload);
      });
    },
    [send, requestEvent, responseEvent]
  );

  return { request };
}
