import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState, type ElementRef } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type MultipleToggleProps = {
  value: number;
  onValueChange: (index: number) => void;
  width: number;
  options?: string[];
};

type MenuPosition = { x: number; y: number; width: number; height: number };

export default function MultipleToggle({
  value,
  onValueChange,
  width,
  options = ['Inteligente', '30 min', '1 hora', '2 horas'],
}: MultipleToggleProps) {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const onClose = () => setVisible(false);

  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0, width: 0, height: 0 });

  const buttonRef = useRef<ElementRef<typeof TouchableOpacity>>(null);

  const openMenu = () => {
    buttonRef.current?.measure(
      (_fx: number, _fy: number, w: number, h: number, px: number, py: number) => {
        setPosition({ x: px, y: py, width: w, height: h });
        setVisible(true);
      },
    );
  };

  const selectedLabel = options[value] || options[0] || '';

  return (
    <>
      <TouchableOpacity ref={buttonRef} onPress={openMenu} style={[styles.container, { width }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={{
            borderRadius: 30,
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }} />
          <Text style={styles.optionText}>
            {selectedLabel.length > 5 ? selectedLabel.slice(0, 5) + '...' : selectedLabel}
          </Text>
          <View style={{ flex: 1 }} />
          <FontAwesome6 name="angle-down" color={theme.colors.contrast} size={21} />
        </LinearGradient>
      </TouchableOpacity>
      <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
        <View
          style={styles.overlay}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} activeOpacity={1} />
          <View
            style={[
              styles.dropdown,
              {
                top: position.y + screenHeight * 0.015,
                left: position.x,
                width: position.width,
              },
            ]}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.item, index === value && styles.itemSelected]}
                onPress={() => {
                  onValueChange(index);
                  onClose();
                }}
              >
                <Text style={[styles.itemText, index === value && styles.itemTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: 30,
      borderWidth: 5,
      borderColor: theme.colors.border,
    },
    optionText: {
      fontFamily: theme.regular,
      fontSize: 21,
      alignSelf: 'center',
      color: theme.colors.contrast,
    },
    overlay: {
      flex: 1,
    },
    overlayTouchable: {
      ...StyleSheet.absoluteFill,
    },
    dropdown: {
      position: 'absolute',
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 8,
      borderWidth: 5,
      borderColor: '#EEE',
      overflow: 'hidden',
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#EEEEEE',
    },
    itemSelected: {
      backgroundColor: theme.colors.surface,
    },
    itemText: {
      fontFamily: 'Aldrich_400Regular',
      fontSize: 18,
      color: theme.colors.text,
    },
    itemTextSelected: {
      color: theme.colors.primaryDark,
    },
  });
