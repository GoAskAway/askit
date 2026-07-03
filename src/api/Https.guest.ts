import type { HostToGuestEventPayloads } from 'askit/contracts';
import { useCallback } from 'react';
import { useEventBridge } from './EventHandler.guest';

type HttpResult = HostToGuestEventPayloads['HTTP_RESPONSE'];
export type HttpResponse<D> = Omit<HttpResult, 'data'> & { data: D };

type HttpHeaders = Record<string, string>;

/**
 * HTTP Hook：封装 HTTP_REQUEST/HTTP_RESPONSE 事件对
 * data 类型由调用方泛型 D 指定（契约中 data 为 unknown）
 */
export function useHttp() {
  const { request } = useEventBridge('HTTP_REQUEST', 'HTTP_RESPONSE');

  const get = useCallback(
    async <D>(requestId: string, url: string, headers?: HttpHeaders): Promise<HttpResponse<D>> => {
      const res = await request({ requestId, url, method: 'GET', headers });
      return { ...res, data: res.data as D };
    },
    [request]
  );

  const post = useCallback(
    async <D>(
      requestId: string,
      url: string,
      body?: unknown,
      headers?: HttpHeaders
    ): Promise<HttpResponse<D>> => {
      const res = await request({ requestId, url, method: 'POST', body, headers });
      return { ...res, data: res.data as D };
    },
    [request]
  );

  return { get, post, request };
}
