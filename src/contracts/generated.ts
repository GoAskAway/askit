/**
 * 由脚本自动生成，请勿手改。
 *
 * 来源：specs/contracts/ask.contracts.v1.json
 * 生成：bun run scripts/generate-contracts.ts
 */

export const ASK_CONTRACT_NAME = "ask" as const;
export const ASK_CONTRACT_VERSION = 1 as const;

export type AskContractName = typeof ASK_CONTRACT_NAME;
export type AskContractVersion = typeof ASK_CONTRACT_VERSION;

export type HostToGuestEventPayloads = {
  "// --- 标准原生能力 ---": unknown;
  "// --- 系统内置 ---": unknown;
  "GEOLOCATION_RESPONSE": { "data"?: { "accuracy": number; "altitude": number | null; "altitudeAccuracy": number | null; "heading": number | null; "latitude": number; "longitude": number; "speed": number | null; }; "error"?: { "code": number; "message": string; }; "requestId": string; "success": boolean; };
  "HOST_VISIBILITY": { "tabId"?: string; "visible": boolean; };
  "HTTP_RESPONSE": { "data": unknown; "requestId": string; "status": number; "success": boolean; };
  "RECEIVER_BACKPRESSURE": { "applied": number; "batchId"?: number; "skipped": number; "total": number; };
  "SPEECH_RESPONSE": { "error"?: unknown; "requestId": string; "success": boolean; };
};
export type HostToGuestEventName = keyof HostToGuestEventPayloads;
export const HOST_TO_GUEST_EVENT_NAMES = ["// --- 标准原生能力 ---", "// --- 系统内置 ---", "GEOLOCATION_RESPONSE", "HOST_VISIBILITY", "HTTP_RESPONSE", "RECEIVER_BACKPRESSURE", "SPEECH_RESPONSE"] as const;
export function isHostToGuestEventName(name: string): name is HostToGuestEventName {
  return ((HOST_TO_GUEST_EVENT_NAMES as readonly string[]).includes(name));
}

export type GuestToHostEventPayloads = {
  "// --- 标准原生能力 ---": unknown;
  "// --- 系统内置 ---": unknown;
  "ASKIT_HAPTIC_TRIGGER": { "type"?: string; };
  "ASKIT_TOAST_SHOW": { "message": string; "options"?: unknown; };
  "GEOLOCATION_REQUEST": { "requestId": string; };
  "GUEST_SLEEP_STATE": { "reason"?: string; "sleeping": boolean; "tabId"?: string; };
  "HTTP_REQUEST": { "body"?: unknown; "headers"?: unknown; "method"?: string; "requestId": string; "url": string; };
  "SPEECH_REQUEST": { "action": unknown; "requestId": string; "text"?: string; };
};
export type GuestToHostEventName = keyof GuestToHostEventPayloads;
export const GUEST_TO_HOST_EVENT_NAMES = ["// --- 标准原生能力 ---", "// --- 系统内置 ---", "ASKIT_HAPTIC_TRIGGER", "ASKIT_TOAST_SHOW", "GEOLOCATION_REQUEST", "GUEST_SLEEP_STATE", "HTTP_REQUEST", "SPEECH_REQUEST"] as const;
export function isGuestToHostEventName(name: string): name is GuestToHostEventName {
  return ((GUEST_TO_HOST_EVENT_NAMES as readonly string[]).includes(name));
}

export type HostToGuestEvent<E extends HostToGuestEventName = HostToGuestEventName> = {
  name: E;
  payload: HostToGuestEventPayloads[E];
};

export type GuestToHostEvent<E extends GuestToHostEventName = GuestToHostEventName> = {
  name: E;
  payload: GuestToHostEventPayloads[E];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validatePayloadAgainstSchema(payload: unknown, schema: Record<string, any>): boolean {
  if (!isPlainObject(payload)) return false;
  const obj = payload as Record<string, unknown>;
  for (const key of Object.keys(schema)) {
    const field = schema[key];
    if (!field || !Array.isArray(field)) continue;

    const [typeOrSchema, optional] = field as [any, boolean];

    if (!(key in obj)) {
      if (!optional) return false;
      continue;
    }

    const value = obj[key];
    if (value === undefined) {
      if (!optional) return false;
      continue;
    }

    // 递归处理嵌套对象
    if (typeof typeOrSchema === 'object' && typeOrSchema !== null) {
      if (!validatePayloadAgainstSchema(value, typeOrSchema)) return false;
      continue;
    }

    const typeStr = typeOrSchema as string;
    const isNullable = typeStr.includes('| null');
    const baseType = typeStr.replace('| null', '').trim();

    if (value === null) {
      if (!isNullable) return false;
      continue;
    }

    if (baseType === 'unknown') continue;
    if (typeof value !== baseType) return false;
  }
  return true;
}

export const HOST_TO_GUEST_PAYLOAD_SCHEMA = {
  "// --- 标准原生能力 ---": {},
  "// --- 系统内置 ---": {},
  "GEOLOCATION_RESPONSE": { "data": [{ "accuracy": ["number", false] as const, "altitude": ["number | null", false] as const, "altitudeAccuracy": ["number | null", false] as const, "heading": ["number | null", false] as const, "latitude": ["number", false] as const, "longitude": ["number", false] as const, "speed": ["number | null", false] as const }, true] as const, "error": [{ "code": ["number", false] as const, "message": ["string", false] as const }, true] as const, "requestId": ["string", false] as const, "success": ["boolean", false] as const },
  "HOST_VISIBILITY": { "tabId": ["string", true] as const, "visible": ["boolean", false] as const },
  "HTTP_RESPONSE": { "data": ["unknown", false] as const, "requestId": ["string", false] as const, "status": ["number", false] as const, "success": ["boolean", false] as const },
  "RECEIVER_BACKPRESSURE": { "applied": ["number", false] as const, "batchId": ["number", true] as const, "skipped": ["number", false] as const, "total": ["number", false] as const },
  "SPEECH_RESPONSE": { "error": ["unknown", true] as const, "requestId": ["string", false] as const, "success": ["boolean", false] as const },
} as const;
export function validateHostToGuestPayload<E extends HostToGuestEventName>(
  name: E,
  payload: unknown
): payload is HostToGuestEventPayloads[E] {
  const schema = (HOST_TO_GUEST_PAYLOAD_SCHEMA as Record<string, Record<string, any>>)[name];
  if (!schema) return false;
  return validatePayloadAgainstSchema(payload, schema);
}

export const GUEST_TO_HOST_PAYLOAD_SCHEMA = {
  "// --- 标准原生能力 ---": {},
  "// --- 系统内置 ---": {},
  "ASKIT_HAPTIC_TRIGGER": { "type": ["string", true] as const },
  "ASKIT_TOAST_SHOW": { "message": ["string", false] as const, "options": ["unknown", true] as const },
  "GEOLOCATION_REQUEST": { "requestId": ["string", false] as const },
  "GUEST_SLEEP_STATE": { "reason": ["string", true] as const, "sleeping": ["boolean", false] as const, "tabId": ["string", true] as const },
  "HTTP_REQUEST": { "body": ["unknown", true] as const, "headers": ["unknown", true] as const, "method": ["string", true] as const, "requestId": ["string", false] as const, "url": ["string", false] as const },
  "SPEECH_REQUEST": { "action": ["unknown", false] as const, "requestId": ["string", false] as const, "text": ["string", true] as const },
} as const;
export function validateGuestToHostPayload<E extends GuestToHostEventName>(
  name: E,
  payload: unknown
): payload is GuestToHostEventPayloads[E] {
  const schema = (GUEST_TO_HOST_PAYLOAD_SCHEMA as Record<string, Record<string, any>>)[name];
  if (!schema) return false;
  return validatePayloadAgainstSchema(payload, schema);
}
