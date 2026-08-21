import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
const { width, height } = Dimensions.get('window');

export default function TutorialOverlay({ 
    visible, 
    steps = [], 
    onFinish, 
    onSkip,
    changeTab
}) {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const [ backColor, setBackColor ] = useState(theme.colors.semiTransparentMain)

    useEffect(() => {
        if (visible) {
            setCurrentStepIndex(0);
            fadeIn();
        }
    }, [visible]);

    useEffect(() => {
        if (!steps || steps.length === 0) return;

        const currentStep = steps[currentStepIndex];
        
        if (!currentStep) return;

        fadeAnim.setValue(0);
        setBackColor("rgba(0,0,0,0)")
        if(currentStep.tab){
            changeTab(currentStep.tab)
            setTimeout(()=>{
                fadeIn()
            },1000)
        }else{
            fadeIn();
        }
    }, [currentStepIndex, steps]);

    const fadeIn = () => {
        setBackColor(theme.colors.semiTransparentMain)
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();
        
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            onFinish();
        }
    };

    if (!visible) return null;

    const currentStep = steps[currentStepIndex];

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={[styles.overlay, {backgroundColor: backColor}]} onTouchStart={(e)=>e.stopPropagation()} onTouchEnd={(e)=>e.stopPropagation()}>
                
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={[theme.colors.primary, theme.colors.primaryDark]}
                            style={styles.iconGradient}
                        >
                            <FontAwesome6 name={currentStep.icon} size={30} color={theme.colors.contrast} />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>{currentStep.title}</Text>
                    <Text style={styles.description}>{currentStep.description}</Text>

                    <View style={styles.dotsContainer}>
                        {steps.map((_, index) => (
                            <View 
                                key={index} 
                                style={[
                                    styles.dot, 
                                    index === currentStepIndex && styles.activeDot
                                ]} 
                            />
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onSkip}>
                            <Text style={styles.skipText}>{t('buttons.skip')}</Text>                            
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNext} >
                            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.nextButton}>
                                <Text style={styles.nextText}>
                                    {currentStepIndex === steps.length - 1 ? t('buttons.start') : t('buttons.next')}
                                </Text>
                                <FontAwesome6 name="arrow-right" size={14} color={theme.colors.contrast} style={{marginLeft: 8}}/>
                            </LinearGradient>
                            
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
}

const createStyles = (theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: theme.colors.background,
        width: '100%',
        borderRadius: 25,
        padding: 25,
        paddingTop: 45,
        alignItems: 'center',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        position: 'absolute',
        top: -30, 
        alignSelf: 'center',
        
        shadowColor: theme.colors.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
    },
    iconGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: theme.regular,
        fontSize: 22,
        color: theme.colors.text,
        marginBottom: 10,
        textAlign: 'center'
    },
    description: {
        fontFamily: theme.regular,
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 8
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.textSecondary
    },
    activeDot: {
        backgroundColor: theme.colors.primaryDark,
        width: 20
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center'
    },
    skipText: {
        fontFamily: theme.regular,
        color: theme.colors.textSecondary,
        fontSize: 14,
        padding: 10
    },
    nextButton: {
        backgroundColor: theme.colors.primaryDark,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    nextText: {
        fontFamily: theme.regular,
        color: theme.colors.contrast,
        fontSize: 14
    }
});