import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PrimitiveTypeName = "string" | "number" | "boolean" | "unknown";

type ContractsEventSpec = {
  summary?: string;
  payload?: Record<string, any>;
};

type AskContractsSpecV1 = {
  name: string;
  version: number;
  hostToGuest: Record<string, ContractsEventSpec>;
  guestToHost: Record<string, ContractsEventSpec>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const askitRoot = path.resolve(__dirname, "..");

/**
 * 解析字段类型。支持:
 * 1. 基础类型: "string", "number", "boolean", "unknown"
 * 2. 可选标记: "string?"
 * 3. Nullable 标记: "string | null"
 */
function parseFieldType(raw: unknown): { ts: string; optional: boolean; isNested: boolean; schema?: any } {
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return { ts: "object", optional: false, isNested: true, schema: raw };
  }
  
  if (typeof raw !== "string") return { ts: "unknown", optional: false, isNested: false };

  const optional = raw.endsWith("?");
  let base = (optional ? raw.slice(0, -1) : raw).trim();
  
  const nullable = base.endsWith("| null");
  if (nullable) {
    base = base.replace("| null", "").trim();
  }

  const ts = (base === "string" || base === "number" || base === "boolean" || base === "unknown") 
    ? base 
    : "unknown";

  return { 
    ts: nullable ? `${ts} | null` : ts, 
    optional, 
    isNested: false 
  };
}

/**
 * 渲染 TypeScript 类型
 */
function renderPayloadType(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "unknown";
  const keys = Object.keys(payload).sort();
  const fields = keys.map((k) => {
    let fieldName = k;
    let optionalKey = false;
    // 支持在 Key 上加 ? 表示可选
    if (k.endsWith('?')) {
      fieldName = k.slice(0, -1);
      optionalKey = true;
    }

    const raw = (payload as any)[k];
    const { ts, optional, isNested, schema } = parseFieldType(raw);
    const finalOptional = optionalKey || optional;
    const typeStr = isNested ? renderPayloadType(schema) : ts;
    
    return `${JSON.stringify(fieldName)}${finalOptional ? "?:" : ":"} ${typeStr};`;
  });
  return `{ ${fields.join(" ")} }`;
}

/**
 * 渲染运行时 Schema
 */
function renderPayloadSchema(payload: unknown): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "{}";
  const keys = Object.keys(payload).sort();
  const fields = keys.map((k) => {
    let fieldName = k;
    let optionalKey = false;
    if (k.endsWith('?')) {
      fieldName = k.slice(0, -1);
      optionalKey = true;
    }

    const raw = (payload as any)[k];
    const { ts, optional, isNested, schema } = parseFieldType(raw);
    const finalOptional = optionalKey || optional;
    
    const value = isNested 
      ? renderPayloadSchema(schema) 
      : JSON.stringify(ts);
    
    // 统一格式为 [typeOrSchema, optional]
    return `${JSON.stringify(fieldName)}: [${value}, ${finalOptional}] as const`;
  });
  return `{ ${fields.join(", ")} }`;
}

function renderPayloadSchemaMap(events: Record<string, ContractsEventSpec>): string {
  const names = Object.keys(events).sort();
  const lines = names.map((name) => {
    const evt = events[name];
    const schema = renderPayloadSchema(evt?.payload);
    return `  ${JSON.stringify(name)}: ${schema},`;
  });
  return `{\n${lines.join("\n")}\n} as const`;
}

function renderConstNames(names: string[], constName: string): string {
  const items = names.map((n) => JSON.stringify(n)).join(", ");
  return `export const ${constName} = [${items}] as const;`;
}

function renderTypeGuard(constName: string, typeName: string, fnName: string): string {
  return `export function ${fnName}(name: string): name is ${typeName} {\n  return ((${constName} as readonly string[]).includes(name));\n}`;
}

async function main(): Promise<void> {
  const defaultSpecPath = path.resolve(askitRoot, "specs", "contracts", "ask.contracts.v1.json");
  const defaultOutPath = path.resolve(askitRoot, "src", "contracts", "generated.ts");

  const specPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultSpecPath;
  const outPath = process.argv[3] ? path.resolve(process.argv[3]) : defaultOutPath;

  const raw = await readFile(specPath, "utf8");
  const spec = JSON.parse(raw) as AskContractsSpecV1;

  const hostToGuestNames = Object.keys(spec.hostToGuest ?? {}).sort();
  const guestToHostNames = Object.keys(spec.guestToHost ?? {}).sort();

  const content = `/**
 * 由脚本自动生成，请勿手改。
 *
 * 来源：${path.relative(askitRoot, specPath)}
 * 生成：bun run scripts/generate-contracts.ts
 */

export const ASK_CONTRACT_NAME = ${JSON.stringify(spec.name)} as const;
export const ASK_CONTRACT_VERSION = ${JSON.stringify(spec.version)} as const;

export type AskContractName = typeof ASK_CONTRACT_NAME;
export type AskContractVersion = typeof ASK_CONTRACT_VERSION;

export type HostToGuestEventPayloads = {
${Object.keys(spec.hostToGuest ?? {}).sort().map(name => `  ${JSON.stringify(name)}: ${renderPayloadType(spec.hostToGuest[name]?.payload)};`).join('\n')}
};
export type HostToGuestEventName = keyof HostToGuestEventPayloads;
${renderConstNames(hostToGuestNames, "HOST_TO_GUEST_EVENT_NAMES")}
${renderTypeGuard("HOST_TO_GUEST_EVENT_NAMES", "HostToGuestEventName", "isHostToGuestEventName")}

export type GuestToHostEventPayloads = {
${Object.keys(spec.guestToHost ?? {}).sort().map(name => `  ${JSON.stringify(name)}: ${renderPayloadType(spec.guestToHost[name]?.payload)};`).join('\n')}
};
export type GuestToHostEventName = keyof GuestToHostEventPayloads;
${renderConstNames(guestToHostNames, "GUEST_TO_HOST_EVENT_NAMES")}
${renderTypeGuard("GUEST_TO_HOST_EVENT_NAMES", "GuestToHostEventName", "isGuestToHostEventName")}

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

export const HOST_TO_GUEST_PAYLOAD_SCHEMA = ${renderPayloadSchemaMap(spec.hostToGuest ?? {})};
export function validateHostToGuestPayload<E extends HostToGuestEventName>(
  name: E,
  payload: unknown
): payload is HostToGuestEventPayloads[E] {
  const schema = (HOST_TO_GUEST_PAYLOAD_SCHEMA as Record<string, Record<string, any>>)[name];
  if (!schema) return false;
  return validatePayloadAgainstSchema(payload, schema);
}

export const GUEST_TO_HOST_PAYLOAD_SCHEMA = ${renderPayloadSchemaMap(spec.guestToHost ?? {})};
export function validateGuestToHostPayload<E extends GuestToHostEventName>(
  name: E,
  payload: unknown
): payload is GuestToHostEventPayloads[E] {
  const schema = (GUEST_TO_HOST_PAYLOAD_SCHEMA as Record<string, Record<string, any>>)[name];
  if (!schema) return false;
  return validatePayloadAgainstSchema(payload, schema);
}
`;

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, content, "utf8");
  console.log(`[askit] contracts generated: ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
