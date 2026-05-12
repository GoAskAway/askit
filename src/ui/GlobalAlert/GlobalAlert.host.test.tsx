import { createElement } from 'react';
import { GlobalAlert, default as GlobalAlertDefault } from './GlobalAlert.host';
import type { GlobalAlertButton, GlobalAlertProps } from '../../types';

describe('GlobalAlert (Host)', () => {
  describe('exports', () => {
    it('GlobalAlert 作为 named export', () => {
      expect(GlobalAlert).toBeDefined();
      expect(typeof GlobalAlert).toBe('function');
    });
    it('GlobalAlert 作为 default export', () => {
      expect(GlobalAlertDefault).toBeDefined();
      expect(GlobalAlertDefault).toBe(GlobalAlert);
    });
  });

  describe('element creation', () => {
    it('createElement 不崩', () => {
      const element = createElement(GlobalAlert, { visible: true });
      expect(element).toBeDefined();
      expect(element.type).toBe(GlobalAlert);
    });
    it('传递 visible/title/message', () => {
      const element = createElement(GlobalAlert, {
        visible: true,
        title: 'T',
        message: 'M',
      } as GlobalAlertProps);
      expect(element.props.visible).toBe(true);
      expect(element.props.title).toBe('T');
      expect(element.props.message).toBe('M');
    });
    it('传递 buttons', () => {
      const buttons: GlobalAlertButton[] = [
        { text: 'OK', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ];
      const element = createElement(GlobalAlert, { visible: true, buttons });
      expect(element.props.buttons).toBe(buttons);
    });
    it('传递 onDismiss/cancelable', () => {
      const onDismiss = () => {};
      const element = createElement(GlobalAlert, {
        visible: false,
        cancelable: false,
        onDismiss,
      });
      expect(element.props.cancelable).toBe(false);
      expect(element.props.onDismiss).toBe(onDismiss);
    });
  });

  describe('GlobalAlertButton 类型', () => {
    it('variant primary', () => {
      const button: GlobalAlertButton = { text: 'OK', variant: 'primary' };
      expect(button.variant).toBe('primary');
    });
    it('style destructive', () => {
      const button: GlobalAlertButton = { text: 'Delete', style: 'destructive' };
      expect(button.style).toBe('destructive');
    });
  });
});
