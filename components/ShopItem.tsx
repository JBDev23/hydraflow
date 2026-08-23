import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import CustomModal from './CustomModal';
import Hat1 from '../assets/hydra/Hat1.svg';
import Hat2 from '../assets/hydra/Hat2.svg';
import Drop from '../assets/Drop.svg';
import SunGlasses from '../assets/hydra/SunGlasses.svg';
import PinkGlasses from '../assets/hydra/PinkGlasses.svg';
import BowTie from '../assets/hydra/BowTie.svg';
import Ribbon from '../assets/hydra/Ribbon.svg';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import type { ShopItemData, Theme } from '../types';

const screenWidth = Dimensions.get('window').width;

const CARD_COLORS: [string, string] = ['#FF00AA', 'rgba(17, 0, 255, 0.4)'];

type ShopItemProps = {
  width?: number;
  height?: number;
  data?: ShopItemData;
  owned?: boolean;
  equipped?: boolean;
  date?: string;
  handleEquip?: (id: string) => void;
  handleBuyed?: (id: string) => void;
  isLoading?: boolean;
  isLoadingApi?: boolean;
};

export default function ShopItem({
  width = 200,
  height = 200,
  data = {
    item: 'sunGlasses',
    name: 'Hydra',
    price: 5,
  },
  owned = false,
  equipped = false,
  date = '26/01/26',
  handleEquip,
  handleBuyed,
  isLoading = false,
  isLoadingApi = false,
}: ShopItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile } = useUser();
  const { t } = useTranslation();

  const drops = userProfile?.stats.dropsBalance ?? 0;
  const canAfford = drops >= data.price;

  const [modalVisible, setModalVisible] = useState(false);

  const renderItem = (size = 82) => {
    const props = { width: size, height: size };
    switch (data.item) {
      case 'hat1':
        return <Hat1 {...props} />;
      case 'hat2':
        return <Hat2 {...props} />;
      case 'sunGlasses':
        return <SunGlasses {...props} />;
      case 'pinkGlasses':
        return <PinkGlasses {...props} />;
      case 'bowTie':
        return <BowTie {...props} />;
      case 'ribbon':
        return <Ribbon {...props} />;
      default:
        return <View style={{ width: size, height: size }} />;
    }
  };

  const onAction = () => {
    if (owned) {
      handleEquip?.(data.item);
      setModalVisible(false);
    } else if (canAfford) {
      handleBuyed?.(data.item);
    }
  };

  useEffect(() => {
    if (!isLoadingApi) {
      setModalVisible(false);
    }
  }, [isLoadingApi]);

  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    }
  }, [isLoading, pulseAnim]);

  if (isLoading) {
    return (
      <Animated.View style={{ opacity: pulseAnim }}>
        <View
          style={[
            styles.skeleton,
            { width, height, backgroundColor: theme.colors.border, borderRadius: 20 },
          ]}
        >
          <View
            style={[
              styles.archInt,
              {
                width: width - 8,
                height: height - 8,
                backgroundColor: theme.colors.background,
                opacity: 0.5,
              },
            ]}
          />
        </View>
      </Animated.View>
    );
  }

  const renderModalContent = () => (
    <View style={styles.item}>
      {renderItem(200)}
      {owned ? (
        <>
          <Text style={[styles.title, { fontSize: 40, lineHeight: 40 }]}>{data.name}</Text>
          <Text style={[styles.date, { fontSize: 25 }]}>
            {t('shopApp.owned')}: {date}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, { fontSize: 40, lineHeight: 40 }]}>{data.name}</Text>
          <View style={styles.priceContainer}>
            <Text
              style={[
                styles.title,
                { fontSize: 40, lineHeight: 40, color: canAfford ? '#32C843' : '#FF4B4B' },
              ]}
            >
              {data.price}
            </Text>
            <Drop />
          </View>
        </>
      )}

      <TouchableOpacity
        onPress={onAction}
        disabled={!owned && !canAfford && isLoadingApi}
        style={[styles.mButton, !owned && !canAfford && isLoadingApi && { opacity: 0.5 }]}
      >
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]}>
          {isLoadingApi ? (
            <Text style={styles.buttonText}>{t('loading')}</Text>
          ) : (
            <Text style={styles.buttonText}>
              {owned ? (equipped ? t('buttons.remove') : t('buttons.equip')) : t('buttons.buy')}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <LinearGradient style={[styles.archievement, { width, height }]} colors={CARD_COLORS}>
          <View style={[styles.archInt, { width: width - 8, height: height - 8 }]}>
            <View style={styles.iconWrapper}>{renderItem(width * 0.5)}</View>

            <Text style={styles.title} numberOfLines={1}>
              {data.name}
            </Text>

            {owned ? (
              <Text style={styles.itemDate}>{date}</Text>
            ) : (
              <View style={styles.priceContainer}>
                <Text
                  style={[
                    styles.title,
                    { color: canAfford ? '#32C843' : '#FF4B4B', marginRight: 5 },
                  ]}
                >
                  {data.price}
                </Text>
                <Drop />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {owned && (
        <View style={styles.checkContainer}>
          {equipped && <FontAwesome6 name="check" color={theme.colors.primaryDark} size={21} />}
        </View>
      )}

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        borderColor={CARD_COLORS[0]}
      >
        {renderModalContent()}
      </CustomModal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
    },
    skeleton: {
      marginBottom: '5%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    archievement: {
      marginBottom: '5%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15,
    },
    archInt: {
      backgroundColor: theme.colors.background,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'space-around',
      borderRadius: 10,
    },
    iconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.regular,
      fontSize: 23,
      marginTop: 5,
      lineHeight: 23,
      color: theme.colors.text,
    },
    date: {
      fontFamily: theme.regular,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    itemDate: {
      fontFamily: theme.regular,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    checkContainer: {
      position: 'absolute',
      top: 10,
      right: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: theme.colors.primaryDark,
      width: 25,
      height: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mButton: {
      width: screenWidth * 0.45,
      borderRadius: 10,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 10,
    },
    buttonText: {
      fontSize: 30,
      fontFamily: theme.regular,
      alignSelf: 'center',
      textAlign: 'center',
      color: theme.colors.contrast,
    },
    item: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    priceContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
