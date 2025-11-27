# API Reference

## Bus

The Bus API provides event-based communication between Host and Plugin.

### Methods

#### `Bus.emit(event, payload?)`

Emit an event with optional payload.

```typescript
Bus.emit('user:action', { type: 'click', target: 'button' });
```

**Parameters:**
- `event: string` - Event name
- `payload?: unknown` - Optional event data

#### `Bus.on(event, handler)`

Subscribe to an event. Returns an unsubscribe function.

```typescript
const unsubscribe = Bus.on('data:update', (data) => {
  console.log('Data updated:', data);
});

// Later: unsubscribe
unsubscribe();
```

**Parameters:**
- `event: string` - Event name to listen for
- `handler: (payload: unknown) => void` - Callback function

**Returns:** `() => void` - Unsubscribe function

#### `Bus.once(event, handler)`

Subscribe to an event for one-time execution.

```typescript
Bus.once('init:complete', () => {
  console.log('Initialization complete');
});
```

#### `Bus.off(event, handler?)`

Remove event listeners.

```typescript
// Remove specific handler
Bus.off('data:update', myHandler);

// Remove all handlers for event
Bus.off('data:update');
```

---

## Toast

Display toast notifications to the user.

### Methods

#### `Toast.show(message, options?)`

Show a toast message.

```typescript
// Simple toast
Toast.show('Hello World!');

// With options
Toast.show('Operation successful', {
  duration: 'long',
  position: 'top'
});

// Custom duration (milliseconds)
Toast.show('Processing...', {
  duration: 5000
});
```

**Parameters:**
- `message: string` - Text to display
- `options?: ToastOptions` - Configuration options

**ToastOptions:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `duration` | `'short' \| 'long' \| number` | `'short'` | Display duration (short=2s, long=3.5s) |
| `position` | `'top' \| 'center' \| 'bottom'` | `'bottom'` | Toast position |

---

## Haptic

Trigger haptic feedback on supported devices.

### Methods

#### `Haptic.trigger(type?)`

Trigger haptic feedback.

```typescript
// Light feedback (default)
Haptic.trigger();
Haptic.trigger('light');

// Medium feedback
Haptic.trigger('medium');

// Heavy feedback
Haptic.trigger('heavy');

// Success feedback
Haptic.trigger('success');

// Warning feedback
Haptic.trigger('warning');

// Error feedback
Haptic.trigger('error');
```

**Parameters:**
- `type?: HapticType` - Feedback intensity/type

**HapticType:**
| Value | Description |
|-------|-------------|
| `'light'` | Subtle feedback |
| `'medium'` | Standard feedback |
| `'heavy'` | Strong feedback |
| `'success'` | Success notification pattern |
| `'warning'` | Warning notification pattern |
| `'error'` | Error notification pattern |

---

## Core Module (Host Only)

The `askit/core` module is only available in the Host App.

### createEngineAdapter(engine)

Create a bridge adapter for the rill engine.

```typescript
import { createEngineAdapter } from 'askit/core';
import { Engine } from 'rill';

const engine = new Engine();
const adapter = createEngineAdapter(engine);
```

### AskitComponents

Map of all registered UI components.

```typescript
import { AskitComponents } from 'askit/core';

// Register with engine
Object.entries(AskitComponents).forEach(([name, Component]) => {
  engine.registerComponent(name, Component);
});
```

### AskitModules

Map of all registered API modules (toast, haptic handlers).

### configureToast(handler)

Override the default toast implementation.

```typescript
import { configureToast } from 'askit/core';

configureToast((message, options) => {
  // Custom toast implementation
  MyCustomToast.show(message, options);
});
```

### configureHaptic(handler)

Override the default haptic implementation.

```typescript
import { configureHaptic } from 'askit/core';

configureHaptic((type) => {
  // Custom haptic implementation
  MyHapticLibrary.trigger(type);
});
```
