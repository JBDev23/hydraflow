import { useState, type ReactNode } from 'react';
import { Dimensions } from 'react-native';
import EditorLayout from './editors/EditorLayout';
import { NameEditor, SliderEditor, WeightEditor } from './editors/SimpleEditors';
import GenderEditor from './editors/GenderEditor';
import ActivityEditor from './editors/ActivityEditor';
import TimeEditor from './editors/TimeEditor';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import type { ProfileFieldKey, ProfileFieldValue, TimeOfDay } from '../types';

const { height: screenHeight } = Dimensions.get('window');

type EditorConfig = {
  height: number;
  title?: string;
  subtitle?: string;
  component: ReactNode;
};

type EditModalProps = {
  item?: ProfileFieldKey;
  value: ProfileFieldValue;
  handleChange: (v: ProfileFieldValue) => void;
};

export default function EditModal({ item = 'name', value, handleChange }: EditModalProps) {
  const [tempVal, setTempVal] = useState<ProfileFieldValue>(value);
  const { calculateIdealGoal, userProfile } = useUser();
  const { t } = useTranslation();

  const unitDist = userProfile?.preferences?.unitDist || 'cm';
  const unitWeight = userProfile?.preferences?.unitWeight || 'kg';

  const getEditorConfig = (): EditorConfig => {
    switch (item) {
      case 'name':
        return {
          height: screenHeight * 0.25,
          title: t('ask.name'),
          component: (
            <NameEditor value={tempVal as string} onChange={(v) => setTempVal(v)} />
          ),
        };
      case 'age':
        return {
          height: screenHeight * 0.2,
          title: t('ask.age'),
          component: (
            <SliderEditor
              value={tempVal as number}
              onChange={(v) => setTempVal(v)}
              min={12}
              max={99}
              step={1}
            />
          ),
        };
      case 'weight': {
        const isLb = unitWeight === 'lb';
        return {
          height: screenHeight * 0.2,
          title: t('ask.weight'),
          component: (
            <WeightEditor
              value={tempVal as number}
              onChange={(v) => setTempVal(v)}
              min={isLb ? 65 : 30}
              max={isLb ? 550 : 250}
            />
          ),
        };
      }
      case 'height': {
        const isFt = unitDist === 'ft';
        return {
          height: screenHeight * 0.2,
          title: t('ask.height'),
          component: (
            <SliderEditor
              value={tempVal as number}
              onChange={(v) => setTempVal(v)}
              min={isFt ? 36 : 100}
              max={isFt ? 101 : 250}
              step={1}
              unit={unitDist}
            />
          ),
        };
      }
      case 'gender':
        return {
          height: screenHeight * 0.15,
          title: t('ask.gender'),
          component: (
            <GenderEditor value={tempVal as string} onChange={(v) => setTempVal(v)} />
          ),
        };
      case 'activity':
        return {
          height: screenHeight * 0.15,
          title: t('ask.activity'),
          component: (
            <ActivityEditor value={tempVal as string} onChange={(v) => setTempVal(v)} />
          ),
        };
      case 'wakeTime':
        return {
          height: screenHeight * 0.2,
          title: t('edit.wakeTime'),
          component: (
            <TimeEditor
              value={tempVal as TimeOfDay}
              onChange={(v) => setTempVal(v)}
              icon="sun"
              colors={['#FFD700', '#FF8C00']}
            />
          ),
        };
      case 'sleepTime':
        return {
          height: screenHeight * 0.2,
          title: t('edit.sleepTime'),
          component: (
            <TimeEditor
              value={tempVal as TimeOfDay}
              onChange={(v) => setTempVal(v)}
              icon="moon"
              colors={['#79D8FE', '#6989E2']}
            />
          ),
        };
      case 'goal':
        return {
          height: screenHeight * 0.15,
          title: t('edit.goal'),
          subtitle: `${t('edit.goalRecommended')} ${calculateIdealGoal()}ml`,
          component: (
            <SliderEditor
              value={tempVal as number}
              onChange={(v) => setTempVal(v)}
              min={1000}
              max={5000}
              step={50}
            />
          ),
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
