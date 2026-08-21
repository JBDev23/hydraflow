import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import Hydra from '../../components/Hydra';
import GradientIcon from '../../components/GradientIcon';
import { FontAwesome6 } from '@expo/vector-icons';
import ShopItem from '../../components/ShopItem';
import Drop from "../../assets/Drop.svg"
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getLocalizedText } from '../../utils/i18nHelpers';
import { audioService } from '../../services/audioService';
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const SKELETONS = Array.from({ length: 6 });

export default function Shop() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { userProfile, updateUserProfile } = useUser()
  const { t } = useTranslation()

  const [shopItems, setShopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingApi, setIsLoadingApi] = useState(false)

  const ownedSkins = userProfile?.skins?.owned || [];
  const equippedSkins = userProfile?.skins?.equipped || [];
  const drops = userProfile?.stats?.dropsBalance || 0

  const skinsCount = userProfile?.stats?.skinsCount || 0

  useEffect(() => {
    const loadCatalog = async () => {
      setIsLoading(true);
      try {
        const items = await api.getItems();
        setShopItems(items);
      } catch (error) {
        console.error("Error cargando tienda:", error);
      } finally {
        setIsLoading(false), 5000;
      }
    };
    loadCatalog();
  }, []);


  const handleEquip = async (itemId) => {
    const previousEquippedSkins = [...equippedSkins];

    let newEquippedList = [...previousEquippedSkins];

    const itemToEquip = shopItems.find(i => i.id === itemId);

    if (itemToEquip) {
      if (newEquippedList.includes(itemId)) {
        newEquippedList = newEquippedList.filter(id => id !== itemId);
      } else {
        newEquippedList = newEquippedList.filter(equippedId => {
          const currentItem = shopItems.find(i => i.id === equippedId);
          return currentItem ? currentItem.category !== itemToEquip.category : true;
        });
        newEquippedList.push(itemId);
      }
      audioService.playSound("equipItem")
    }

    updateUserProfile({
      skins: {
        owned: ownedSkins,
        equipped: newEquippedList
      }
    });

    try {
      const updatedUserItems = await api.equipItem(itemId);

      if (!updatedUserItems) {
        throw new Error("Error en servidor");
      }
    } catch (error) {
      console.error("Error optimista equipando:", error);
      updateUserProfile({
        skins: {
          owned: ownedSkins,
          equipped: previousEquippedSkins
        }
      });
    }
  };

  const handleBuy = async (itemId) => {
    if (ownedSkins.includes(itemId)) return;
    setIsLoadingApi(true)

    try {
      const response = await api.buyItem(itemId);

      if (response) {
        const updatedUserItems = response.items;

        const newOwned = updatedUserItems.map(i => i.itemId);
        const newEquipped = updatedUserItems.filter(i => i.isEquipped).map(i => i.itemId);

        

        await updateUserProfile({
          skins: {
            owned: newOwned,
            equipped: newEquipped
          },
          stats: {
            ...userProfile.stats,
            dropsBalance: response.dropsBalance,
            skinsCount: response.skinsCount
          }
        });
      }
    } catch (error) {
      console.warn(error)
    } finally {
      audioService.playSound("buyItem")
      setIsLoadingApi(false)
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.upperContainer}>
        <View style={{ width: "42%" }}>
          <Hydra height={screenWidth * 0.4} showSkins={true} />
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statText}>{t("shopApp.skins")}:</Text>
            <View style={styles.statContainer}>
              <Text style={styles.statText}>{skinsCount}</Text>
              <GradientIcon size={26} colors={['#FF01AA', '#A099FF']}>
                <FontAwesome6 size={21} name="shirt" />
              </GradientIcon>
            </View>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statText}>Drops:</Text>
            <View style={styles.statContainer}>
              <Text style={styles.statText}>{drops || 0}</Text>
              <Drop width={26} />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.achievementsContainer}>
        {isLoading ? (
          SKELETONS.map((_, index) => (
            <ShopItem
              key={`skeleton-${index}`}
              width={screenWidth * 0.9 * 0.48}
              height={screenWidth * 0.9 * 0.48}
              isLoading={true}
            />
          ))
        ) : (
          shopItems.map((skin) => {
            const name = getLocalizedText(skin.name)

            return (
              <ShopItem
                key={skin.id}
                width={screenWidth * 0.9 * 0.48}
                height={screenWidth * 0.9 * 0.48}
                data={{
                  item: skin.id,
                  name: name,
                  price: skin.price
                }}
                owned={ownedSkins.includes(skin.id)}
                equipped={equippedSkins.includes(skin.id)}
                handleEquip={handleEquip}
                handleBuyed={handleBuy}
                isLoadingApi={isLoadingApi}
                />
            )
          })
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    paddingBottom: "5%",
    paddingTop: "3%",
  },
  upperContainer: {
    flexDirection: "row",
    width: screenWidth * 0.9,
    alignSelf: "center",
    marginTop: "1%"
  },
  statsContainer: {
    width: "58%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  statContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5
  },
  texto: {
    fontFamily: theme.regular,
    color: theme.colors.text,
    fontSize: 25
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 10
  },
  statText: {
    fontFamily: theme.regular,
    color: theme.colors.text,
    fontSize: 27,
  },
  achievementsContainer: {
    flex: 1,
    width: screenWidth * 0.9,
    alignSelf: "center",
    marginTop: "10%",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
}); 