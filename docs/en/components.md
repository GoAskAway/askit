# Components

askit provides a set of UI components that work across Host and Plugin environments.

## How Components Work

In **Plugin** (QuickJS): Components return DSL (Domain Specific Language) objects that describe the UI structure.

In **Host** (React Native): Components render as actual React Native views.

```typescript
// Plugin side - generates DSL
const avatar = UserAvatar({ uri: 'https://...', size: 48 });
// Returns: { type: 'UserAvatar', props: { uri: '...', size: 48 } }

// Host side - renders React Native component
<UserAvatar uri="https://..." size={48} />
```

---

## StepList

A step-by-step list with status indicators, commonly used for onboarding or progress tracking.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `steps` | `Step[]` | Yes | Array of step objects |
| `currentStep` | `number` | No | Currently active step index |

### Step Object

```typescript
interface Step {
  title: string;
  description?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
}
```

### Example

```typescript
import { StepList } from 'askit';

const steps = [
  { title: 'Connect Wallet', status: 'completed' },
  { title: 'Verify Identity', status: 'active' },
  { title: 'Complete Setup', status: 'pending' }
];

StepList({ steps, currentStep: 1 });
```

---

## ThemeView

A container view that adapts to the current theme (light/dark mode).

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | No | Child elements |
| `style` | `ViewStyle` | No | Additional styles |
| `lightStyle` | `ViewStyle` | No | Styles for light mode |
| `darkStyle` | `ViewStyle` | No | Styles for dark mode |

### Example

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

Display user avatar with fallback support.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `uri` | `string` | No | Image URL |
| `name` | `string` | No | User name (for fallback initials) |
| `size` | `number` | No | Avatar size in pixels (default: 40) |
| `style` | `ViewStyle` | No | Additional styles |

### Example

```typescript
import { UserAvatar } from 'askit';

// With image
UserAvatar({ uri: 'https://example.com/avatar.png', size: 48 });

// With fallback initials
UserAvatar({ name: 'John Doe', size: 48 });
// Shows "JD" as fallback
```

---

## ChatBubble

Chat message bubble component.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `message` | `string` | Yes | Message content |
| `isOwn` | `boolean` | No | Whether message is from current user |
| `timestamp` | `string` | No | Message timestamp |
| `status` | `'sending' \| 'sent' \| 'delivered' \| 'read'` | No | Message status |
| `style` | `ViewStyle` | No | Additional styles |

### Example

```typescript
import { ChatBubble } from 'askit';

// Received message
ChatBubble({
  message: 'Hello!',
  isOwn: false,
  timestamp: '10:30 AM'
});

// Sent message
ChatBubble({
  message: 'Hi there!',
  isOwn: true,
  timestamp: '10:31 AM',
  status: 'delivered'
});
```

---

## Custom Components

You can create custom components that follow the same pattern:

### In Plugin (DSL Generator)

```typescript
// my-component.remote.tsx
export function MyComponent(props: MyComponentProps) {
  return {
    type: 'MyComponent',
    props
  };
}
```

### In Host (React Native)

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

### Register in Core

```typescript
// In your host app setup
import { MyComponent } from './MyComponent.native';

engine.registerComponent('MyComponent', MyComponent);
```
