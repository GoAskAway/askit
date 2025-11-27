# 组件

askit 提供一组可在 Host 和 Plugin 环境中使用的 UI 组件。

## 组件工作原理

在 **Plugin** (QuickJS) 中：组件返回描述 UI 结构的 DSL（领域特定语言）对象。

在 **Host** (React Native) 中：组件渲染为实际的 React Native 视图。

```typescript
// Plugin 端 - 生成 DSL
const avatar = UserAvatar({ uri: 'https://...', size: 48 });
// 返回: { type: 'UserAvatar', props: { uri: '...', size: 48 } }

// Host 端 - 渲染 React Native 组件
<UserAvatar uri="https://..." size={48} />
```

---

## StepList

带状态指示器的步骤列表，常用于引导流程或进度追踪。

### Props

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `steps` | `Step[]` | 是 | 步骤对象数组 |
| `currentStep` | `number` | 否 | 当前激活的步骤索引 |

### Step 对象

```typescript
interface Step {
  title: string;
  description?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
}
```

### 示例

```typescript
import { StepList } from 'askit';

const steps = [
  { title: '连接钱包', status: 'completed' },
  { title: '验证身份', status: 'active' },
  { title: '完成设置', status: 'pending' }
];

StepList({ steps, currentStep: 1 });
```

---

## ThemeView

适应当前主题（亮色/暗色模式）的容器视图。

### Props

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `children` | `ReactNode` | 否 | 子元素 |
| `style` | `ViewStyle` | 否 | 附加样式 |
| `lightStyle` | `ViewStyle` | 否 | 亮色模式样式 |
| `darkStyle` | `ViewStyle` | 否 | 暗色模式样式 |

### 示例

```typescript
import { ThemeView } from 'askit';

ThemeView({
  style: { padding: 16 },
  lightStyle: { backgroundColor: '#ffffff' },
  darkStyle: { backgroundColor: '#1a1a1a' },
  children: [/* ... */]
});
```

---

## UserAvatar

带降级支持的用户头像显示。

### Props

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `uri` | `string` | 否 | 图片 URL |
| `name` | `string` | 否 | 用户名（用于降级显示首字母） |
| `size` | `number` | 否 | 头像尺寸（像素，默认: 40） |
| `style` | `ViewStyle` | 否 | 附加样式 |

### 示例

```typescript
import { UserAvatar } from 'askit';

// 使用图片
UserAvatar({ uri: 'https://example.com/avatar.png', size: 48 });

// 使用降级首字母
UserAvatar({ name: 'John Doe', size: 48 });
// 显示 "JD" 作为降级
```

---

## ChatBubble

聊天消息气泡组件。

### Props

| 属性 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `message` | `string` | 是 | 消息内容 |
| `isOwn` | `boolean` | 否 | 是否为当前用户的消息 |
| `timestamp` | `string` | 否 | 消息时间戳 |
| `status` | `'sending' \| 'sent' \| 'delivered' \| 'read'` | 否 | 消息状态 |
| `style` | `ViewStyle` | 否 | 附加样式 |

### 示例

```typescript
import { ChatBubble } from 'askit';

// 收到的消息
ChatBubble({
  message: '你好!',
  isOwn: false,
  timestamp: '10:30 AM'
});

// 发送的消息
ChatBubble({
  message: '嗨!',
  isOwn: true,
  timestamp: '10:31 AM',
  status: 'delivered'
});
```

---

## 自定义组件

你可以创建遵循相同模式的自定义组件：

### 在 Plugin 中（DSL 生成器）

```typescript
// my-component.remote.tsx
export function MyComponent(props: MyComponentProps) {
  return {
    type: 'MyComponent',
    props
  };
}
```

### 在 Host 中（React Native）

```typescript
// my-component.native.tsx
import React from 'react';
import { View, Text } from 'react-native';

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <View>
      <Text>{title}</Text>
      {children}
    </View>
  );
}
```

### 在 Core 中注册

```typescript
// 在 Host App 设置中
import { MyComponent } from './MyComponent.native';

engine.registerComponent('MyComponent', MyComponent);
```
