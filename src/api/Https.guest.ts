import { useCallback } from 'react';
import { HostToGuestEventPayloads } from 'askit/contracts';
import { useHostApi } from './HostApi.guest';

// type THttpResponse = HostToGuestEventPayloads['HTTP_RESPONSE'];
export type HttpResponse<T, D> = Omit<T, 'data'> & { data: D };

/**
 * 封装后的 HTTP Hook，提供面向对象的调用体验
 * FIXME 因为相应返回类型不确定，需要外部传入，无法从事件契约匹配
 */
export function useHttp() {
  const { request } = useHostApi('HTTP_REQUEST', 'HTTP_RESPONSE');

  const get = useCallback(
    async <T, D>(requestId: string, url: string, headers?: any) => {
      const res = await request({ requestId, url, method: 'GET', headers });
      return res as unknown as HttpResponse<T, D>;
    },
    [request]
  );

  const post = useCallback(
    async <T, D>(requestId: string, url: string, body?: any, headers?: any) => {
      const res = await request({ requestId, url, method: 'POST', body, headers });
      return res as unknown as HttpResponse<T, D>;
    },
    [request]
  );

  return { get, post, request };
}
