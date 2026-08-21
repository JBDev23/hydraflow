import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react"
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import CustomModal from "./CustomModal";
import EditModal from "./EditModal";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useUser } from "../context/UserContext";
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function ProfileItem({ value, field, changeUser }) {
    const { theme } = useTheme();
    const {t} = useTranslation()
    const {userProfile} = useUser()

    const unitWeight = userProfile?.preferences?.unitWeight || "kg";
    const unitDist = userProfile?.preferences?.unitDist || "cm";
    
    const VALUE_MAP = useMemo(() => ({
        male: t("profile.male"),
        female: t("profile.female"),
        other: t("profile.other"),
        sedentary: t("profile.sedentary"),
        moderate: t("profile.moderate"),
        active: t("profile.active"),
        highActive: t("profile.highActive")
    }), [t]);
    
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [modalVisible, setModalVisible] = useState(false)

    const kgToLb = (kg) => Math.round(kg * 2.20462);
    const lbToKg = (lb) => Math.round(lb / 2.20462);
    
    const cmToInches = (cm) => Math.round(cm / 2.54);
    const inchesToCm = (inches) => Math.round(inches * 2.54);

    const formatFtIn = (totalInches) => {
        if (!totalInches) return "0' 0\"";
        const ft = Math.floor(totalInches / 12);
        const inc = totalInches % 12;
        return `${ft}' ${inc}"`;
    };

    const onSave = (newVal) => {
        let finalVal = newVal;
        
        if (field.key === 'weight' && unitWeight === 'lb') {
            finalVal = lbToKg(newVal);
        }
        if (field.key === 'height' && unitDist === 'ft') {
            finalVal = inchesToCm(newVal);
        }
        
        changeUser(field.key, finalVal);
        setModalVisible(false);
    };

    const editValue = useMemo(() => {
        if (!value && value !== 0) return value;
        if (field.key === 'weight' && unitWeight === 'lb') return kgToLb(value);
        if (field.key === 'height' && unitDist === 'ft') return cmToInches(value);
        return value; 
    }, [value, field.key, unitWeight, unitDist]);

    const formatTimeToString = (timeObj) => {
        if (!timeObj) return "00:00";
        const h = timeObj.hours.toString().padStart(2, '0');
        const m = timeObj.minutes.toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const displayValue = useMemo(() => {
        if (field.key === 'weight') return `${editValue} ${unitWeight}`;
        if (field.key === 'height') {
            return unitDist === 'ft' ? formatFtIn(editValue) : `${editValue} cm`;
        }

        if (typeof value === 'object' && value !== null) {
            return formatTimeToString(value);
        }
        
        if (VALUE_MAP[value]) {
            return VALUE_MAP[value]; 
        }

        let val = value?.toString() || "";
        return val.length > 9 ? val.slice(0,8) + "..." : val;
    }, [value, editValue, field.key, unitWeight, unitDist, VALUE_MAP]);

    return (
        <>
            <View key={field.key} style={styles.profileContainer}>
                <View style={styles.profileItem}>
                    <Text style={styles.profileItemText}>{t(field.label)}</Text>
                    <Text style={[styles.statText, { color: theme.colors.textTertiary }]}>
                        {displayValue}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editContainer}>
                    <LinearGradient style={styles.editButton} colors={[theme.colors.primary, theme.colors.primaryDark]}>
                        <FontAwesome6 name="pen" size={21} color={theme.colors.contrast} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
            <CustomModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                borderColor={theme.colors.primaryDark}
            >
                <EditModal item={field.key} value={editValue} handleChange={onSave} />
            </CustomModal>
        </>
    )
}

const createStyles = (theme) => StyleSheet.create({
    profileContainer: {
        flexDirection: "row", 
        width: "100%", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "3%"
    },
    profileItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderRadius: 20,
        borderWidth: 5,
        borderColor: theme.colors.border,
        paddingHorizontal: 10,
        width: "85%",
        backgroundColor: theme.colors.background,
        elevation: 5,
    },
    editContainer: {
        width: screenWidth * 0.9 * 0.12, 
        height: screenWidth * 0.9 * 0.12
    },
    statText: {
        fontFamily: theme.regular,
        color: theme.colors.text,
        fontSize: 27,
    },
    profileItemText: {
        fontFamily: theme.regular,
        color: theme.colors.text,
        fontSize: 25,
    },
    editButton: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10
    }
}); 