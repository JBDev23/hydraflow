import { useState } from "react";
import { Dimensions } from "react-native";
import EditorLayout from "./editors/EditorLayout";
import { NameEditor, SliderEditor, WeightEditor } from "./editors/SimpleEditors";
import GenderEditor from "./editors/GenderEditor"
import ActivityEditor from "./editors/ActivityEditor";
import TimeEditor from "./editors/TimeEditor";
import { useUser } from "../context/UserContext";
import { useTranslation } from "react-i18next";

const { height: screenHeight } = Dimensions.get('window');

export default function EditModal({ item = "name", value, handleChange }) {
    const [tempVal, setTempVal] = useState(value);
    const { calculateIdealGoal, userProfile } = useUser();
    const { t } = useTranslation();

    const unitDist = userProfile?.preferences?.unitDist || "cm";
    const unitWeight = userProfile?.preferences?.unitWeight || "kg";

    const getEditorConfig = () => {
        switch (item) {
            case "name":
                return {
                    height: screenHeight * 0.25,
                    title: t("ask.name"),
                    component: <NameEditor value={tempVal} onChange={setTempVal} />
                };
            case "age":
                return {
                    height: screenHeight * 0.20,
                    title: t("ask.age"),
                    component: <SliderEditor value={tempVal} onChange={setTempVal} min={12} max={99} step={1} />
                };
            case "weight":
                const isLb = unitWeight === "lb";
                return {
                    height: screenHeight * 0.20,
                    title: t("ask.weight"),
                    component: <WeightEditor 
                        value={tempVal} 
                        onChange={setTempVal} 
                        mmin={isLb ? 65 : 30} 
                        max={isLb ? 550 : 250} 
                    />
                };
            case "height":
                const isFt = unitDist === "ft";
                return {
                    height: screenHeight * 0.20,
                    title: t("ask.height"),
                    component: <SliderEditor 
                        value={tempVal} 
                        onChange={setTempVal} 
                        min={isFt ? 36 : 100}
                        max={isFt ? 101 : 250}
                        step={1} 
                        unit={unitDist}
                    />
                };
            case "gender":
                return {
                    height: screenHeight * 0.15,
                    title: t("ask.gender"),
                    component: <GenderEditor value={tempVal} onChange={setTempVal} />
                };
            case "activity":
                return {
                    height: screenHeight * 0.15,
                    title: t("ask.activity"),
                    component: <ActivityEditor value={tempVal} onChange={setTempVal} />
                };
            case "wakeTime":
                return {
                    height: screenHeight * 0.20,
                    title: t("edit.wakeTime"),
                    component: <TimeEditor value={tempVal} onChange={setTempVal} icon="sun" colors={['#FFD700', '#FF8C00']} />
                };
            case "sleepTime":
                return {
                    height: screenHeight * 0.20,
                    title: t("edit.sleepTime"),
                    component: <TimeEditor value={tempVal} onChange={setTempVal} icon="moon" colors={['#79D8FE', '#6989E2']} />
                };
            case "goal":
                return {
                    height: screenHeight * 0.15,
                    title: t("edit.goal"),
                    subtitle: `${t("edit.goalRecommended")} ${calculateIdealGoal()}ml`,
                    component: <SliderEditor value={tempVal} onChange={setTempVal} min={1000} max={5000} step={50} />
                };
            default:
                return { height: 0, component: null };
        }
    };

    const config = getEditorConfig();

    return (
        <EditorLayout
            hydraHeight={config.height}
            title={config.title}
            subtitle={config.subtitle}
            onSave={() => handleChange(tempVal)}
        >
            {config.component}
        </EditorLayout>
    );
}