import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useMemo } from 'react';
import Hydra from './Hydra';
import Drop from '../assets/Drop.svg';
import type { LevelUpModalConfig, Theme } from '../types';

const screenHeight = Dimensions.get('window').height;

type LevelUpModalProps = {
  modalConfig?: LevelUpModalConfig;
};

export default function LevelUpModal({ modalConfig = { level: 1, drops: 0 } }: LevelUpModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <Hydra height={screenHeight * 0.25} anim="joy" showSkins={true} />
      <Text style={styles.title}>¡¡HAS SUBIDO DE NIVEL!!</Text>
      <Text style={styles.title}>
        NIVEL: <Text style={{ color: '#FFD700' }}>{modalConfig.level}</Text>
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={styles.title}>
          HAS GANADO: <Text style={{ color: '#FFD700' }}>{modalConfig.drops}</Text>
        </Text>
        <Drop />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.regular,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 4 },
      textShadowRadius: 5,
      color: theme.colors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 21,
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
