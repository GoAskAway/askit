# Architecture

## Overview

askit implements an **isomorphic architecture** that enables the same code to run in different environments with environment-specific implementations.

## Design Principles

### 1. Same API, Different Implementations

Developers write code using the same API surface regardless of the execution environment:

```typescript
// This code works in both Host and Plugin
import { Bus, Toast } from 'askit';

Bus.emit('action', { type: 'click' });
Toast.show('Hello!');
```

### 2. Conditional Exports

The `package.json` uses conditional exports to serve different bundles:

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

- **react-native**: Native implementations with real React Native components
- **default**: Remote implementations with message passing

### 3. 90% Universal + 10% Core

| Category | Location | Purpose |
|----------|----------|---------|
| Universal (90%) | `askit` | APIs and components usable in both environments |
| Core (10%) | `askit/core` | Host-only bridging and registration |

## Message Flow

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
│  │  Components  │                               │          │
│  └──────────────┘                               │          │
└─────────────────────────────────────────────────┼──────────┘
                                                  │
                                    Message Protocol (JSON)
                                                  │
┌─────────────────────────────────────────────────┼──────────┐
│                        PLUGIN                    │          │
│                                                  ▼          │
│                                        ┌──────────────┐    │
│                                        │   QuickJS    │    │
│                                        │   Sandbox    │    │
│                                        └──────┬───────┘    │
│                                               │            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                    askit (remote)                     │ │
│  │                                                       │ │
│  │  Bus.emit('event') ──► global.sendToHost(message)    │ │
│  │  Toast.show()      ──► askit:toast:show message      │ │
│  │  Haptic.trigger()  ──► askit:haptic:trigger message  │ │
│  │  Component()       ──► Returns DSL object            │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### Native Implementations (`*.native.ts`)

Execute directly in the Host App:

```typescript
// Toast.native.ts
import { ToastAndroid, Platform } from 'react-native';

export const Toast = {
  show(message: string, options?: ToastOptions) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    // iOS: use custom implementation
  }
};
```

### Remote Implementations (`*.remote.ts`)

Send messages to Host for execution:

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

### Bridge (`core/bridge.ts`)

Routes messages from Plugin to appropriate handlers:

```typescript
function handlePluginMessage(message: PluginMessage) {
  const parsed = parseAskitEvent(message.event);
  // 'askit:toast:show' → module='toast', method='show'

  if (parsed) {
    const handler = AskitModules[parsed.module];
    handler?.[parsed.method]?.(message.payload);
  }
}
```

### Registry (`core/registry.ts`)

Manages component and module registration:

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

## Build System

askit uses [tsup](https://github.com/egoist/tsup) for multi-target builds:

```typescript
// tsup.config.ts
export default defineConfig([
  {
    entry: { index: 'src/index.native.ts' },
    outDir: 'dist/native',
    // React Native bundle
  },
  {
    entry: { index: 'src/index.remote.ts' },
    outDir: 'dist/remote',
    // QuickJS/Node bundle
  },
  {
    entry: { index: 'src/core/index.ts' },
    outDir: 'dist/core',
    // Host-only core module
  }
]);
```

## Testing Strategy

| Layer | Environment | Tools |
|-------|-------------|-------|
| API Logic | Node.js | Vitest |
| Android-specific | Mock injection | Vitest + DI |
| UI Components | React Native | E2E / Integration |
| Full Integration | Device/Simulator | Detox |

```typescript
// Example: Testing Android-specific code with dependency injection
import { _injectMocks, NativeToast } from './Toast.native';

beforeEach(() => {
  _injectMocks(
    { OS: 'android' },
    { showWithGravity: vi.fn(), SHORT: 0, BOTTOM: 80 }
  );
});

it('should call ToastAndroid on Android', () => {
  const toast = new NativeToast();
  toast.show('Hello');
  expect(mockShowWithGravity).toHaveBeenCalled();
});
```
