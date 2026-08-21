import { useEffect, useRef, useState } from "react";
import HydraIdle from "../assets/hydra/Hydra.svg"
import HydraBlink from "../assets/hydra/Hydra_blink.svg"
import Hat1 from "../assets/hydra/Hat1.svg"
import Hat2 from "../assets/hydra/Hat2.svg"
import SunGlasses from "../assets/hydra/SunGlasses.svg"
import PinkGlasses from "../assets/hydra/PinkGlasses.svg"
import BowTie from "../assets/hydra/BowTie.svg"
import Ribbon from "../assets/hydra/Ribbon.svg"
import { Animated, Dimensions, Easing, StyleSheet } from "react-native";
import { useUser } from "../context/UserContext";
const screenWidth = Dimensions.get('window').width;

export default function Hydra({anim="default", height=screenWidth*0.6, showSkins=false}){
    const { userProfile } = useUser()

    const [ state, setState ] = useState("idle")

    const skins = userProfile?.skins?.equipped || [];
    
    const bounce = useRef(new Animated.Value(0)).current
    const scale = useRef(new Animated.Value(1)).current

    const currentAnimRef = useRef(null);

    useEffect(() => {

        if (currentAnimRef.current) {
            currentAnimRef.current.stop();
            currentAnimRef.current = null;
        }

        bounce.stopAnimation();
        scale.stopAnimation();

        const resetAnimation = Animated.parallel([
            Animated.timing(bounce, {
                toValue: 0,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        ]);

        resetAnimation.start(() => {
            let newAnimation;

            switch (anim) {
                case "default":                
                    newAnimation = Animated.loop(
                        Animated.parallel([
                            Animated.sequence([
                                Animated.timing(bounce, {
                                    toValue: 5,
                                    duration: 2000,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(bounce, {
                                    toValue: 0,
                                    duration: 2000,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                })
                            ]),
                            Animated.sequence([
                                Animated.timing(scale, {
                                    toValue: 1.025,
                                    duration: 2000,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(scale, {
                                    toValue: 1,
                                    duration: 2000,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                })
                            ]),

                        ])
                        
                    )
                    break;

                case "joy":
                    newAnimation = Animated.loop(
                        Animated.parallel([
                            Animated.sequence([
                                Animated.timing(bounce, {
                                    toValue: 5,
                                    duration: 500,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(bounce, {
                                    toValue: 0,
                                    duration: 500,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                })
                            ]),
                            Animated.sequence([
                                Animated.timing(scale, {
                                    toValue: 1.025,
                                    duration: 500,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                }),
                                Animated.timing(scale, {
                                    toValue: 1,
                                    duration: 500,
                                    easing: Easing.inOut(Easing.sin),
                                    useNativeDriver: true,
                                })
                            ]),

                        ])
                        
                    )
            }

            newAnimation.start();
            currentAnimRef.current = newAnimation;
        });

        return () => {
            if (currentAnimRef.current) {
                currentAnimRef.current.stop();
            }
        };

    }, [anim]);

    const timeoutRef = useRef(null);

    useEffect(() => {
        const loopBlink = () => {
            const timeUntilNextBlink = Math.random() * 4000 + 2000;
            timeoutRef.current = setTimeout(() => {
                setState((prev) => prev+"blink")
                setTimeout(() => {
                    setState((prev)=>prev.replace("blink", ""));
                    loopBlink(); 
                }, 150);
            }, timeUntilNextBlink);
        };
        loopBlink();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);


    const renderContent = () => {
        switch (state) {
            case "idle":
                return <HydraIdle/>
            case "idleblink":
                return <HydraBlink/>
            default :
                return <HydraIdle/>
        }
    }

    const renderSkins = () => {
        if (!showSkins) return
        const toRender = []
        for (let i = 0; i<skins.length; i++){
            let skin = skins[i]
            switch (skin) {
            case "hat1":
                toRender.push(<Hat1 key={skin} style={styles.hat} width={"40%"}/>)
                break
            case "hat2":
                toRender.push(<Hat2 key={skin} style={styles.hat2} width={"60%"}/>)
                break
            case "sunGlasses":
                toRender.push(<SunGlasses key={skin} style={styles.sunGlasses} width={"45%"}/>)
                break
            case "pinkGlasses":
                toRender.push(<PinkGlasses key={skin} style={styles.pinkGlasses} width={"65%"}/>)
                break
            case "bowTie":
                toRender.push(<BowTie key={skin} style={styles.bowTie} width={"45%"}/>)
                break
            case "ribbon":
                toRender.push(<Ribbon key={skin} style={styles.ribbon} width={"45%"}/>)
                break
            default :
                continue
        }
        }
        return toRender
    }
    
    return (
        <Animated.View width={height} height={height} style={{transform: [{translateY:bounce}, {scale: scale}],zIndex: 1000, position: "relative"}}>
            {renderContent()}
            {renderSkins()}
        </Animated.View>
    )

}

const styles = StyleSheet.create({
    hat: {
        position: "absolute",
        left: "32%",
        top: "-30%",
    },
    hat2: {
        position: "absolute",
        left: "28%",
        top: "-20%",
    },
    sunGlasses: {
        position: "absolute",
        left: "28%",
        top: "8%",
    },
    pinkGlasses: {
        position: "absolute",
        left: "18%",
        top: "7%",
    },
    bowTie: {
        position: "absolute",
        left: "28%",
        top: "38%",
    },
    ribbon: {
        position: "absolute",
        left: "30%",
        top: "-20%",
    },
})