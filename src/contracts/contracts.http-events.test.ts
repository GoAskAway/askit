import {
  isGuestToHostEventName,
  isHostToGuestEventName,
  validateGuestToHostPayload,
  validateHostToGuestPayload,
} from './generated';

describe('HTTP/SPEECH 契约事件', () => {
  describe('事件名守卫', () => {
    it('HTTP_REQUEST / HTTP_RESPONSE 已注册', () => {
      expect(isGuestToHostEventName('HTTP_REQUEST')).toBe(true);
      expect(isHostToGuestEventName('HTTP_RESPONSE')).toBe(true);
    });
    it('SPEECH_REQUEST / SPEECH_RESPONSE 已注册', () => {
      expect(isGuestToHostEventName('SPEECH_REQUEST')).toBe(true);
      expect(isHostToGuestEventName('SPEECH_RESPONSE')).toBe(true);
    });
    it('未知事件名拒绝', () => {
      expect(isGuestToHostEventName('NOT_AN_EVENT')).toBe(false);
      expect(isHostToGuestEventName('NOT_AN_EVENT')).toBe(false);
    });
  });

  describe('HTTP_REQUEST payload', () => {
    it('必填 requestId + url', () => {
      expect(
        validateGuestToHostPayload('HTTP_REQUEST', { requestId: 'r1', url: 'https://x' })
      ).toBe(true);
      expect(validateGuestToHostPayload('HTTP_REQUEST', { url: 'https://x' })).toBe(false);
      expect(validateGuestToHostPayload('HTTP_REQUEST', { requestId: 'r1' })).toBe(false);
    });
    it('可选 method/headers/body', () => {
      expect(
        validateGuestToHostPayload('HTTP_REQUEST', {
          requestId: 'r1',
          url: 'https://x',
          method: 'POST',
          headers: { a: 'b' },
          body: { k: 1 },
        })
      ).toBe(true);
    });
    it('method 类型校验', () => {
      expect(
        validateGuestToHostPayload('HTTP_REQUEST', { requestId: 'r1', url: 'u', method: 123 })
      ).toBe(false);
    });
    it('非对象拒绝', () => {
      expect(validateGuestToHostPayload('HTTP_REQUEST', null)).toBe(false);
      expect(validateGuestToHostPayload('HTTP_REQUEST', 'x')).toBe(false);
    });
  });

  describe('HTTP_RESPONSE payload', () => {
    it('必填 requestId/success/status/data', () => {
      expect(
        validateHostToGuestPayload('HTTP_RESPONSE', {
          requestId: 'r1',
          success: true,
          status: 200,
          data: {},
        })
      ).toBe(true);
      expect(
        validateHostToGuestPayload('HTTP_RESPONSE', {
          requestId: 'r1',
          success: true,
          status: 200,
        })
      ).toBe(false);
    });
    it('status 类型校验', () => {
      expect(
        validateHostToGuestPayload('HTTP_RESPONSE', {
          requestId: 'r1',
          success: true,
          status: '200',
          data: {},
        })
      ).toBe(false);
    });
  });

  describe('SPEECH_REQUEST payload', () => {
    it('必填 requestId + action', () => {
      expect(
        validateGuestToHostPayload('SPEECH_REQUEST', { requestId: 'r1', action: 'speak' })
      ).toBe(true);
      expect(validateGuestToHostPayload('SPEECH_REQUEST', { action: 'speak' })).toBe(false);
    });
    it('可选 text', () => {
      expect(
        validateGuestToHostPayload('SPEECH_REQUEST', {
          requestId: 'r1',
          action: 'speak',
          text: 'hi',
        })
      ).toBe(true);
    });
  });

  describe('SPEECH_RESPONSE payload', () => {
    it('必填 requestId + success', () => {
      expect(
        validateHostToGuestPayload('SPEECH_RESPONSE', { requestId: 'r1', success: true })
      ).toBe(true);
      expect(validateHostToGuestPayload('SPEECH_RESPONSE', { requestId: 'r1' })).toBe(false);
    });
    it('可选 error', () => {
      expect(
        validateHostToGuestPayload('SPEECH_RESPONSE', {
          requestId: 'r1',
          success: false,
          error: 'fail',
        })
      ).toBe(true);
    });
  });
});
