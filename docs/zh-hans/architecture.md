# 架构

## 概述

askit 实现了**同构架构**，使相同的代码能够在不同环境中运行，并提供特定于环境的实现。

## 设计原则

### 1. 相同 API，不同实现

开发者使用相同的 API 接口编写代码，无论执行环境如何：

```typescript
// 这段代码在 Host 和 Guest 中都能工作
import { Bus, Toast } from 'askit';

Bus.emit('action', { type: 'click' });
Toast.show('Hello!');
```

### 2. 条件导出

`package.json` 使用条件导出来提供不同的包：

```json
{
  "exports": {
    ".": {
      "react-native": "./dist/native/index.js",
      "default": "./dist/remote/index.js"
    }
  }
}
```

- **react-native**：带有真实 React Native 组件的原生实现
- **default**：带有消息传递的远程实现

### 3. 90% 通用 + 10% 核心

| 类别 | 位置 | 用途 |
|------|------|------|
| 通用 (90%) | `askit` | 两个环境都可用的 API 和组件 |
| 核心 (10%) | `askit/core` | 仅 Host 端的桥接和注册 |

## 消息流

```
┌─────────────────────────────────────────────────────────────┐
│                        HOST APP                              │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   askit      │    │  askit/core  │    │    rill      │  │
│  │   (native)   │◄───│   bridge     │◄───│   Engine     │  │
│  └──────────────┘    └──────────────┘    └──────┬───────┘  │
│         │                                        │          │
│         ▼                                        │          │
│  ┌──────────────┐                               │          │
│  │ React Native │                               │          │
│  │    组件      │                               │          │
│  └──────────────┘                               │          │
└─────────────────────────────────────────────────┼──────────┘
                                                  │
                                    消息协议 (JSON)
                                                  │
┌─────────────────────────────────────────────────┼──────────┐
│                        PLUGIN                    │          │
│                                                  ▼          │
│                                        ┌──────────────┐    │
│                                        │   QuickJS    │    │
│                                        │    沙箱      │    │
│                                        └──────┬───────┘    │
│                                               │            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                    askit (remote)                     │ │
│  │                                                       │ │
│  │  Bus.emit('event') ──► global.sendToHost(message)    │ │
│  │  Toast.show()      ──► askit:toast:show 消息         │ │
│  │  Haptic.trigger()  ──► askit:haptic:trigger 消息     │ │
│  │  Component()       ──► 返回 DSL 对象                  │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 模块职责

### 原生实现 (`*.native.ts`)

直接在 Host App 中执行：

```typescript
// Toast.native.ts
import { ToastAndroid, Platform } from 'react-native';

export const Toast = {
  show(message: string, options?: ToastOptions) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    // iOS: 使用自定义实现
  }
};
```

### 远程实现 (`*.remote.ts`)

发送消息到 Host 执行：

```typescript
// Toast.remote.ts
export const Toast = {
  show(message: string, options?: ToastOptions) {
    global.sendToHost({
      event: 'askit:toast:show',
      payload: { message, options }
    });
  }
};
```

### 桥接 (`core/bridge.ts`)

将 Guest 消息路由到适当的处理器：

```typescript
function handleGuestMessage(message: GuestMessage) {
  const parsed = parseAskitEvent(message.event);
  // 'askit:toast:show' → module='toast', method='show'

  if (parsed) {
    const handler = AskitModules[parsed.module];
    handler?.[parsed.method]?.(message.payload);
  }
}
```

### 注册表 (`core/registry.ts`)

管理组件和模块注册：

```typescript
export const AskitComponents = {
  StepList,
  ThemeView,
  UserAvatar,
  ChatBubble
};

export const AskitModules = {
  toast: { show: (payload) => Toast.show(...) },
  haptic: { trigger: (payload) => Haptic.trigger(...) }
};
```

## 构建系统

askit 使用 [tsup](https://github.com/egoist/tsup) 进行多目标构建：

```typescript
// tsup.config.ts
export default defineConfig([
  {
    entry: { index: 'src/index.native.ts' },
    outDir: 'dist/native',
    // React Native 包
  },
  {
    entry: { index: 'src/index.remote.ts' },
    outDir: 'dist/remote',
    // QuickJS/Node 包
  },
  {
    entry: { index: 'src/core/index.ts' },
    outDir: 'dist/core',
    // 仅 Host 端核心模块
  }
]);
```

## 测试策略

| 层级 | 环境 | 工具 |
|------|------|------|
| API 逻辑 | Node.js | Vitest |
| Android 特定 | Mock 注入 | Vitest + DI |
| UI 组件 | React Native | E2E / 集成测试 |
| 完整集成 | 设备/模拟器 | Detox |

```typescript
// 示例：使用依赖注入测试 Android 特定代码
import { _injectMocks, NativeToast } from './Toast.native';

beforeEach(() => {
  _injectMocks(
    { OS: 'android' },
    { showWithGravity: vi.fn(), SHORT: 0, BOTTOM: 80 }
  );
});

it('应该在 Android 上调用 ToastAndroid', () => {
  const toast = new NativeToast();
  toast.show('Hello');
  expect(mockShowWithGravity).toHaveBeenCalled();
});
```
