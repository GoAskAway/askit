# API 参考

## Bus

Bus API 提供 Host 与 Guest 之间基于事件的通信。

### 方法

#### `Bus.emit(event, payload?)`

发送带有可选负载的事件。

```typescript
Bus.emit('user:action', { type: 'click', target: 'button' });
```

**参数：**
- `event: string` - 事件名称
- `payload?: unknown` - 可选的事件数据

#### `Bus.on(event, handler)`

订阅事件。返回取消订阅函数。

```typescript
const unsubscribe = Bus.on('data:update', (data) => {
  console.log('数据更新:', data);
});

// 稍后：取消订阅
unsubscribe();
```

**参数：**
- `event: string` - 要监听的事件名称
- `handler: (payload: unknown) => void` - 回调函数

**返回：** `() => void` - 取消订阅函数

#### `Bus.once(event, handler)`

订阅事件，只执行一次。

```typescript
Bus.once('init:complete', () => {
  console.log('初始化完成');
});
```

#### `Bus.off(event, handler?)`

移除事件监听器。

```typescript
// 移除特定处理器
Bus.off('data:update', myHandler);

// 移除事件的所有处理器
Bus.off('data:update');
```

---

## Toast

向用户显示 Toast 通知。

### 方法

#### `Toast.show(message, options?)`

显示 Toast 消息。

```typescript
// 简单 Toast
Toast.show('Hello World!');

// 带选项
Toast.show('操作成功', {
  duration: 'long',
  position: 'top'
});

// 自定义时长（毫秒）
Toast.show('处理中...', {
  duration: 5000
});
```

**参数：**
- `message: string` - 要显示的文本
- `options?: ToastOptions` - 配置选项

**ToastOptions：**
| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `duration` | `'short' \| 'long' \| number` | `'short'` | 显示时长（short=2秒，long=3.5秒） |
| `position` | `'top' \| 'center' \| 'bottom'` | `'bottom'` | Toast 位置 |

---

## Haptic

在支持的设备上触发触觉反馈。

### 方法

#### `Haptic.trigger(type?)`

触发触觉反馈。

```typescript
// 轻度反馈（默认）
Haptic.trigger();
Haptic.trigger('light');

// 中度反馈
Haptic.trigger('medium');

// 重度反馈
Haptic.trigger('heavy');

// 成功反馈
Haptic.trigger('success');

// 警告反馈
Haptic.trigger('warning');

// 错误反馈
Haptic.trigger('error');
```

**参数：**
- `type?: HapticType` - 反馈强度/类型

**HapticType：**
| 值 | 描述 |
|----|------|
| `'light'` | 轻微反馈 |
| `'medium'` | 标准反馈 |
| `'heavy'` | 强烈反馈 |
| `'success'` | 成功通知模式 |
| `'warning'` | 警告通知模式 |
| `'error'` | 错误通知模式 |

---

## Core 模块（仅 Host）

`askit/core` 模块仅在 Host App 中可用。

### createEngineAdapter(engine)

为 rill 引擎创建桥接适配器。

```typescript
import { createEngineAdapter } from 'askit/core';
import { Engine } from 'rill';

const engine = new Engine();
const adapter = createEngineAdapter(engine);
```

### AskitComponents

所有已注册 UI 组件的映射。

```typescript
import { AskitComponents } from 'askit/core';

// 注册到引擎
Object.entries(AskitComponents).forEach(([name, Component]) => {
  engine.registerComponent(name, Component);
});
```

### AskitModules

所有已注册 API 模块的映射（toast、haptic 处理器）。

### configureToast(handler)

覆盖默认的 Toast 实现。

```typescript
import { configureToast } from 'askit/core';

configureToast((message, options) => {
  // 自定义 Toast 实现
  MyCustomToast.show(message, options);
});
```

### configureHaptic(handler)

覆盖默认的 Haptic 实现。

```typescript
import { configureHaptic } from 'askit/core';

configureHaptic((type) => {
  // 自定义触觉反馈实现
  MyHapticLibrary.trigger(type);
});
```
