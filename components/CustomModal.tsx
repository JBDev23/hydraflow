import { Modal, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useMemo, type ReactNode } from 'react';
import type { Theme } from '../types';

const { height, width } = Dimensions.get('window');

type CustomModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  borderColor?: string;
};

export default function CustomModal({
  visible,
  onClose,
  children,
  borderColor,
}: CustomModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeBorderColor = borderColor || theme.colors.primaryDark;

  const stopPropagation = () => {};

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay} onTouchStart={stopPropagation} onTouchEnd={stopPropagation}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={[styles.modalContent, { borderColor: activeBorderColor }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome6 name="xmark" size={32} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTouchable: {
      ...StyleSheet.absoluteFill,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      padding: 24,
      width: width * 0.8,
      height: height * 0.55,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
      borderWidth: 3,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    body: {
      flex: 1,
    },
  });
