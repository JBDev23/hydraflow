import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuración Global
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FREQUENCY_MAP = {
  // smart se calcula dinámicamente ahora
  30: 30,
  60: 60,
  120: 120,
};

const ANDROID_CHANNEL_ID = 'hydration-reminders';

/**
 * Valida y normaliza la configuración de horario
 */
const validateTimeConfig = (timeConfig, defaultHour, defaultMinute) => {
  const hour = Math.max(0, Math.min(23, parseInt(timeConfig?.hours || defaultHour)));
  const minute = Math.max(0, Math.min(59, parseInt(timeConfig?.minutes || defaultMinute)));
  return { hour, minute };
};

/**
 * Configura el canal de notificaciones para Android
 */
const setupAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de Hidratación',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#79D8FE',
      enableVibrate: true,
      enableLights: true,
    });
  } catch (error) {
    console.warn('⚠️ Error configurando canal Android:', error);
  }
};

/**
 * Genera tiempos fijos basados en intervalo (Para modos 30min, 1h, 2h)
 */
const generateFixedScheduleTimes = (wakeTime, sleepTime, intervalMinutes) => {
  const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
  const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;

  const times = [];
  let currentMinutes = wakeMinutes + intervalMinutes;

  while (currentMinutes < sleepMinutes) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    times.push({ hour, minute });
    currentMinutes += intervalMinutes;
  }
  return times;
};

/**
 * Genera tiempos dinámicos "Smart" basados en el agua restante
 */
const generateSmartScheduleTimes = (sleepTime, dailyGoal, currentDrinked) => {
  const remainingWater = dailyGoal - currentDrinked;

  // Si ya cumplió la meta, no programamos nada
  if (remainingWater <= 0) return [];

  // Calcular cuántos vasos de 250ml faltan (redondeando hacia arriba)
  const cupsNeeded = Math.ceil(remainingWater / 250);

  // Obtener tiempo actual y tiempo de dormir en minutos
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;

  // Si ya es hora de dormir o queda muy poco tiempo (menos de 30 min), no programamos
  if (currentMinutes >= sleepMinutes - 30) return [];

  const availableMinutes = sleepMinutes - currentMinutes;

  // Calcular intervalo: Tiempo disponible dividido por vasos necesarios
  // Forzamos un mínimo de 30 minutos para no saturar si bebe mucho de golpe tarde
  const calculatedInterval = Math.max(30, Math.floor(availableMinutes / cupsNeeded));

  const times = [];
  let nextNotificationMinute = currentMinutes + calculatedInterval;

  for (let i = 0; i < cupsNeeded; i++) {
    // Si nos pasamos de la hora de dormir, paramos
    
    if (nextNotificationMinute >= sleepMinutes) break;

    const hour = Math.floor(nextNotificationMinute / 60);
    const minute = nextNotificationMinute % 60;
    
    // Ajustar si pasa de medianoche (aunque sleepMinutes debería prevenirlo)
    const normalizedHour = hour >= 24 ? hour - 24 : hour;

    times.push({ hour: normalizedHour, minute });

    nextNotificationMinute += calculatedInterval;
  }
  return times;
};


/**
 * Programa una notificación individual
 */
const scheduleNotificationAtTime = async (hour, minute, channelId, repeats) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Hora de hidratarse! 💧',
        body: 'Tu cuerpo necesita agua para alcanzar la meta de hoy.',
        sound: true,
        vibrate: [0, 250, 250, 250],
        data: { type: 'hydration-reminder' },
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: {
        type: 'daily',
        hour,
        minute,
        repeats, // Smart no repite mañana (mañana se recalcula), Fijo sí repite
      },
    });

    return notificationId;
  } catch (error) {
    console.error(`❌ Error programando notificación a las ${hour}:${minute.toString().padStart(2, '0')}:`, error);
    // No lanzamos error para no romper el Promise.all completo
    return null; 
  }
};

export const notificationService = {
  /**
   * Solicita permisos de notificaciones
   */
  requestPermissions: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificaciones denegados.');
        return false;
      }

      await setupAndroidChannel();
      return true;
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  },

  /**
   * Programa recordatorios de hidratación
   * AHORA ACEPTA: goal y currentDrinked para el modo Smart
   */
  scheduleReminders: async (settings, dailyGoal = 2000, currentDrinked = 0) => {
    try {
      // Validar entrada
      if (!settings?.notifications?.enabled) {
        await notificationService.cancelAll();
        return { success: true, scheduled: 0, message: 'Notificaciones desactivadas' };
      }

      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) throw new Error('Permisos no otorgados');

      // Limpiar anteriores y mostrar log de debuggeando
      const preExisting = await Notifications.getAllScheduledNotificationsAsync();
      
      await notificationService.cancelAll();

      const wakeTime = validateTimeConfig(settings.wakeTime, 8, 0);
      const sleepTime = validateTimeConfig(settings.sleepTime, 23, 0);
      
      const freqKey = settings.notifications.frequency || 'smart';
      const isSmartMode = freqKey === 'smart';

      // Validar horario lógico
      const wakeMinutes = wakeTime.hour * 60 + wakeTime.minute;
      const sleepMinutes = sleepTime.hour * 60 + sleepTime.minute;
      if (wakeMinutes >= sleepMinutes) throw new Error('Hora de despertar debe ser anterior a dormir');

      let scheduleTimes = [];
      let shouldRepeat = true;

      if (isSmartMode) {
        // --- MODO SMART ---
        // Calcula recordatorios basados en lo que falta por beber HOY
        scheduleTimes = generateSmartScheduleTimes(sleepTime, dailyGoal, currentDrinked);
        // IMPORTANTE: Smart no repite diariamente porque depende del consumo actual.
        // La app debe llamar a scheduleReminders cada vez que el usuario beba agua.
        shouldRepeat = false; 
      } else {
        // --- MODO FIJO ---
        const intervalMinutes = FREQUENCY_MAP[freqKey] || 90;
        scheduleTimes = generateFixedScheduleTimes(wakeTime, sleepTime, intervalMinutes);
        shouldRepeat = true; // Estos sí se repiten cada día igual
      }

      if (scheduleTimes.length === 0) {
        // Puede pasar en Smart si ya cumplió la meta
        return { success: true, scheduled: 0, message: 'No hay recordatorios necesarios para hoy' };
      }

      // Programar
      const results = await Promise.all(
        scheduleTimes.map(({ hour, minute }) => 
          scheduleNotificationAtTime(hour, minute, ANDROID_CHANNEL_ID, shouldRepeat)
        )
      );
      
      const scheduledCount = results.filter(id => id !== null).length;
      
      // Verificar que se programaron correctamente
      const postScheduled = await Notifications.getAllScheduledNotificationsAsync();

      return {
        success: true,
        scheduled: scheduledCount,
        message: `${scheduledCount} recordatorios programados (${isSmartMode ? 'Hoy' : 'Diarios'})`,
      };
    } catch (error) {
      console.error('❌ Error en scheduleReminders:', error);
      return { success: false, scheduled: 0, message: error.message };
    }
  },

  /**
   * Cancela todas las notificaciones programadas
   */
  cancelAll: async () => {
    try {
      // Obtener count antes de cancelar para logging
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      await Notifications.cancelAllScheduledNotificationsAsync();
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelando notificaciones:', error);
      return { success: false, error };
    }
  },

  getAllScheduled: async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Notificaciones programadas: ${scheduled.length}`, 
      scheduled.map(n => `${n.trigger.hour}:${String(n.trigger.minute).padStart(2, '0')}`)
    );
    return scheduled;
  },
};