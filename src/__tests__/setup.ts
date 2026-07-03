/**
 * Bun test setup file for askit
 * Provides react-native mock for testing host components
 */

import { mock } from 'bun:test';

// Mock react-native module before any imports
mock.module('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Pressable: 'Pressable',
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  TextInput: 'TextInput',
  Switch: 'Switch',
  Button: 'Button',
  Modal: 'Modal',
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
    flatten: (style: unknown) => style,
    hairlineWidth: 1,
  },
  Platform: {
    OS: 'ios',
    select: <T>(obj: { ios?: T; android?: T; default?: T }): T | undefined =>
      obj.ios ?? obj.default,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  Alert: {
    alert: () => {},
  },
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image',
    ScrollView: 'Animated.ScrollView',
    Value: class {
      constructor(public _value: number) {}
      setValue(value: number) {
        this._value = value;
      }
      interpolate() {
        return this;
      }
    },
    timing: () => ({ start: (cb?: () => void) => cb?.() }),
    spring: () => ({ start: (cb?: () => void) => cb?.() }),
    parallel: () => ({ start: (cb?: () => void) => cb?.() }),
    sequence: () => ({ start: (cb?: () => void) => cb?.() }),
  },
  Easing: {
    cubic: (t: number) => t,
    out: (easing: (t: number) => number) => easing,
    in: (easing: (t: number) => number) => easing,
    inOut: (easing: (t: number) => number) => easing,
  },
  Vibration: {
    vibrate: () => {},
    cancel: () => {},
  },
}));
