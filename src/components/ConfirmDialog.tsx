import { useRef, type ReactNode, type RefObject } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  type HostInstance,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Botão que abriu o diálogo: o foco volta para ele ao cancelar ou fechar.
  returnFocusTo: RefObject<HostInstance | null>;
  danger?: boolean;
  confirmDisabled?: boolean;
  loading?: boolean;
  // Gera `<prefixo>.confirm` e `<prefixo>.cancel`.
  testIDPrefix: string;
  // Campo de senha e erro do Excluir. Com children, o foco inicial é do campo (autoFocus).
  children?: ReactNode;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  returnFocusTo,
  danger,
  confirmDisabled,
  loading,
  testIDPrefix,
  children,
}: Props) {
  const cancelRef = useRef<HostInstance>(null);

  const focus = (ref: RefObject<HostInstance | null>) => {
    if (ref.current) AccessibilityInfo.sendAccessibilityEvent(ref.current, 'focus');
  };

  // Aqui e não no onDismiss: ele só existe no iOS. Durante a exclusão o Cancelar fica travado.
  const cancel = () => {
    if (loading) return;
    onCancel();
    focus(returnFocusTo);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => {
        if (!children) focus(cancelRef);
      }}
      onRequestClose={cancel}
    >
      <View style={styles.scrim} />
      {/* O teclado do campo de senha cobriria os botões. */}
      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={styles.dialog} accessibilityViewIsModal onAccessibilityEscape={cancel}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message} accessibilityRole="alert">
            {message}
          </Text>
          {children}
          <View style={styles.actions}>
            <Button
              ref={cancelRef}
              label="Cancelar"
              variant="secondary"
              onPress={cancel}
              disabled={loading}
              testID={`${testIDPrefix}.cancel`}
            />
            <Button
              label={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              onPress={onConfirm}
              disabled={confirmDisabled}
              loading={loading}
              testID={`${testIDPrefix}.confirm`}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Mesmo 0.6 do `dim` do Button: escurece sem esconder a tela de trás.
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.text, opacity: 0.6 },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  dialog: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.heading, color: colors.text },
  message: { ...typography.body, color: colors.text },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.sm },
});
