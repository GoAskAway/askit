/**
 * GlobalAlert - Host Implementation
 *
 * 受控的全局弹窗组件，通过 visible prop 控制显隐，
 * 支持多按钮、点击蒙层关闭、进出动画。
 */

import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GlobalAlertButton, GlobalAlertProps } from '../../types';

// 主题颜色
const COLORS = {
  mask: 'rgba(0, 0, 0, 0.1)',
  dialogBg: '#FFFFFF',
  titleText: '#000000',
  messageText: '#3C3C43',
  buttonText: '#007AFF',
  buttonPrimaryBg: '#007AFF',
  buttonPrimaryText: '#FFFFFF',
  buttonCancelBg: '#E5E5EA',
  buttonTextCancel: '#000000',
  buttonTextDestructive: '#FF3B30',
};

const DEFAULT_BUTTON: GlobalAlertButton = { text: '好' };

/**
 * GlobalAlert Component
 */
export function GlobalAlert({
  visible,
  title,
  message,
  buttons,
  cancelable = true,
  onDismiss,
}: GlobalAlertProps) {
  const maskOpacity = useRef(new Animated.Value(0)).current;
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(1.08)).current;
  const isClosingRef = useRef(false);

  const resolvedButtons = buttons?.length ? buttons : [DEFAULT_BUTTON];
  const isTwoButtons = resolvedButtons.length === 2;

  // 显示动画
  useEffect(() => {
    if (!visible) return;
    isClosingRef.current = false;
    maskOpacity.setValue(1);
    dialogOpacity.setValue(1);
    dialogScale.setValue(1.08);
    Animated.timing(dialogScale, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, dialogOpacity, dialogScale, maskOpacity]);

  // 隐藏动画
  const dismissWithAnimation = useCallback(
    (dismissed: boolean, onAfterClose?: () => void) => {
      if (isClosingRef.current) return;
      isClosingRef.current = true;
      Animated.parallel([
        Animated.timing(maskOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(dialogOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        onAfterClose?.();
        if (dismissed) {
          onDismiss?.();
        }
      });
    },
    [dialogOpacity, maskOpacity, onDismiss]
  );

  const handleMaskPress = useCallback(() => {
    if (!cancelable) return;
    dismissWithAnimation(true);
  }, [cancelable, dismissWithAnimation]);

  const handleButtonPress = useCallback(
    (button: GlobalAlertButton) => {
      dismissWithAnimation(true, button.onPress);
    },
    [dismissWithAnimation]
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.host} pointerEvents="box-none">
        <View style={styles.backdrop}>
          <Animated.View style={[styles.mask, { opacity: maskOpacity }]} />
          <Pressable style={styles.maskTouch} onPress={handleMaskPress} />
          <View style={styles.dialogWrap} pointerEvents="box-none">
            <Animated.View style={{ opacity: dialogOpacity, transform: [{ scale: dialogScale }] }}>
              <Pressable style={styles.dialog} onPress={() => {}}>
                {!!title && <Text style={styles.title}>{title}</Text>}
                {!!message && <Text style={styles.message}>{message}</Text>}
                <View
                  style={[
                    styles.buttonContainer,
                    isTwoButtons
                      ? styles.buttonContainerHorizontal
                      : styles.buttonContainerVertical,
                  ]}
                >
                  {resolvedButtons.map((button, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleButtonPress(button)}
                      style={({ pressed }) => [
                        styles.button,
                        button.variant === 'primary' ? styles.buttonPrimary : undefined,
                        isTwoButtons ? styles.buttonHalf : styles.buttonFull,
                        pressed ? styles.buttonPressed : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          button.variant === 'primary' ? styles.buttonTextPrimary : undefined,
                          button.style === 'cancel' ? styles.buttonTextCancel : undefined,
                          button.style === 'destructive' ? styles.buttonTextDestructive : undefined,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    flex: 1,
  },
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.mask,
  },
  maskTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dialog: {
    width: 300,
    borderRadius: 36,
    backgroundColor: COLORS.dialogBg,
    padding: 14,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.titleText,
    textAlign: 'left',
    paddingLeft: 8,
    paddingTop: 8,
  },
  message: {
    paddingLeft: 8,
    marginTop: 10,
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.messageText,
    textAlign: 'left',
    paddingBottom: 14,
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: 'column',
    gap: 10,
  },
  buttonContainerHorizontal: {
    flexDirection: 'row',
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    height: 48,
    borderRadius: 26,
    backgroundColor: COLORS.buttonCancelBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonPrimary: {
    backgroundColor: COLORS.buttonPrimaryBg,
  },
  buttonFull: {
    width: '100%',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 17,
    lineHeight: 22,
    color: COLORS.buttonText,
  },
  buttonTextPrimary: {
    color: COLORS.buttonPrimaryText,
    fontWeight: '600',
  },
  buttonTextCancel: {
    fontWeight: '600',
  },
  buttonTextDestructive: {
    color: COLORS.buttonTextDestructive,
  },
});

export default GlobalAlert;
