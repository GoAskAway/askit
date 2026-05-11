import {
  HostToGuestEventPayloads,
  GuestToHostEventPayloads,
} from 'askit/contracts';

type THttpRequest = GuestToHostEventPayloads['HTTP_REQUEST'];
export type THttpResponse = HostToGuestEventPayloads['HTTP_RESPONSE'];

export class HostHttpHandler {
  /**
   * 处理来自 Guest 的 HTTP 请求
   * @param payload 请求负载
   */
  static async handleRequest(payload: THttpRequest): Promise<THttpResponse> {
    const { requestId, url, method = 'GET', headers, body } = payload;

    try {
      console.log(
        `[HostHttpHandler] Requesting ${method} ${url} (ID: ${requestId})`,
      );

      // 准备 fetch 参数
      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: (headers as HeadersInit_) || {},
      };

      // 非 GET/HEAD 请求处理 body
      if (body && !['GET', 'HEAD'].includes(fetchOptions.method!)) {
        fetchOptions.body =
          typeof body === 'string' ? body : JSON.stringify(body);

        // 如果是对象且没设 Content-Type，默认补上 application/json
        const h = new Headers(fetchOptions.headers);
        if (!h.has('content-type') && typeof body !== 'string') {
          h.set('content-type', 'application/json');
          fetchOptions.headers = h;
        }
      }

      const response = await fetch(url, fetchOptions);

      // 尝试解析数据，如果不是 JSON 则返回文本或 null
      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        requestId,
        success: response.ok,
        status: response.status,
        data,
      };
    } catch (error: any) {
      console.error(`[HostHttpHandler] Failed (ID: ${requestId}):`, error);
      return {
        requestId,
        status: 400,
        success: false,
        data: {
          message: error.message,
        },
      };
    }
  }
}
