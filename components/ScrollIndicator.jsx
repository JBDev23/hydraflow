import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ScrollIndicator({ visible }) {
    const { theme } = useTheme();
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Animación de rebote infinita
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceAnim, {
                        toValue: 10, // Cuánto baja
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceAnim, {
                        toValue: 0, // Vuelve a subir
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            bounceAnim.stopAnimation();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                <FontAwesome6 
                    name="angle-down" 
                    size={24} 
                    color={theme.colors.textSecondary || '#888'} 
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        right: 10,
        alignSelf: 'flex-end',
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 5,
    }
});