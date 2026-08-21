import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDateForBackend } from "../utils/dateFormatter";
import { offlineManager } from "./offline";
import i18n from "../app/i18n";
import { toProfileUpdatePayload } from "./profilePayload";
import { showToast } from "../utils/toast";
import { calculateXpGain } from "../utils/xp";
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://hydraflow-backend-production.up.railway.app"; 
let sessionExpiredCallback = null;
let isSyncing = false;

// Función auxiliar para obtener cabeceras con el token
const getHeaders = async () => {
  const token = await AsyncStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    "X-Timezone-Offset": String(new Date().getTimezoneOffset()),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const rawFetch = async (endpoint, method, body) => {
  const headers = await getHeaders();
  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (response.status === 401) {
    if (sessionExpiredCallback) {
      sessionExpiredCallback();
    }
    throw new Error("Sesión expirada");
  }

  if (!response.ok) {
    const text = await response.text();
    try {
      const jsonErr = JSON.parse(text);
      throw new Error(jsonErr.error || `Error ${response.status}`);
    } catch (e) {
      throw new Error(text || `Error ${response.status}`);
    }
  }
  return response.json();
};

const notifyOffline = () => {
  showToast("☁️ " + i18n.t("toast.offlineSave"));
};

const notifyError = (
  msg = "⚠️ " + i18n.t("toast.conecctionError"),
) => {
  showToast(msg);
};

export const api = {
  setupSessionInterceptor: (callback) => {
    sessionExpiredCallback = callback;
  },

  // Login / Registro Social
  login: async (payload) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error("❌ Error API Login:", error);
      throw error;
    }
  },

  // Guardar datos del usuario (Peso, Altura, Skins...)
  updateUser: async (data) => {
    const payload = toProfileUpdatePayload(data);
    if (Object.keys(payload).length === 0) {
      return { success: true, skipped: true };
    }
    try {
      return await rawFetch('/user/profile', 'PUT', payload);
    } catch (error) {
      if (error.message === "Sesión expirada") return null;
      console.error("Error Update:", error);
      await offlineManager.addToQueue({ type: "UPDATE_USER", payload });
      notifyOffline();
      return { success: true, offline: true };
    }
  },

  logWater: async (amount) => {
    try {
      return await rawFetch('/water/log', 'POST', { amount });
    } catch (error) {
      console.log(error.message)
      if (error.message === "Sesión expirada") return null;
      await offlineManager.addToQueue({
        type: "LOG_WATER",
        payload: { amount },
      });
      notifyOffline();
      return {
        success: true,
        offline: true,
        gamification: {
          xpGained: calculateXpGain(amount),
          offlineOptimistic: true,
        },
      };
    }
  },

  getDailyMetrics: async (date) => {
    try {
      const headers = await getHeaders();
      const url = date
        ? `${API_URL}/water/metrics?date=${formatDateForBackend(date)}`
        : `${API_URL}/water/metrics`;

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (response.status === 401) {
        if (sessionExpiredCallback) {
          sessionExpiredCallback();
        }
        // Interceptor ya hace logout; no re-lanzar para evitar ruido en la UI
        return null;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
      return data.total || 0;
    } catch (error) {
      console.error("Error getDailyMetrics:", error);
      // null = fallo de red/API; no confundir con "0 ml bebidos"
      return null;
    }
  },

  revertLog: async () => {
    try {
      return await rawFetch('/water/log', 'DELETE');
    } catch (error) {
      if (error.message === "Sesión expirada") return null;

      // Prefer canceling a pending offline drink over queuing DELETE
      const cancelled = await offlineManager.cancelLastPendingLogWater();
      if (cancelled?.amount != null) {
        notifyOffline();
        return {
          success: true,
          offline: true,
          cancelledPending: true,
          deletedAmount: cancelled.amount,
        };
      }

      await offlineManager.addToQueue({ type: "REVERT_LOG", payload: {} });
      notifyOffline();
      return {
        success: true,
        offline: true,
        gamification: null,
      };
    }
  },

  getUser: async () => {
    try {
      const response = await rawFetch('/user/profile', 'GET');
      return response.user;
    } catch (error) {
      if (error.message === "Sesión expirada") return null;
      console.error("Error refresh user:", error);
      return null;
    }
  },

  getRangeMetrics: async (startDate, endDate) => {
    const formatedStart = formatDateForBackend(startDate);
    const formatedEnd = formatDateForBackend(endDate);

    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${API_URL}/water/range?startDate=${formatedStart}&endDate=${formatedEnd}`,
        {
          method: "GET",
          headers: headers,
        },
      );

      if (response.status === 401 && sessionExpiredCallback) {
        sessionExpiredCallback();
        return null;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.totals;
    } catch (error) {
      console.error("Error get range metrics:", error);
      return null;
    }
  },

  getStats: async (mode, date) => {
    const formatedRefDate = formatDateForBackend(date);

    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${API_URL}/water/stats?mode=${mode}&refDate=${formatedRefDate}`,
        {
          method: "GET",
          headers: headers,
        },
      );

      if (response.status === 401 && sessionExpiredCallback) {
        sessionExpiredCallback();
        return null;
      }

      const jsonResponse = await response.json();
      if (!response.ok) throw new Error(jsonResponse.error);

      const graphData = jsonResponse.data;

      let stats = {};

      switch (mode) {
        case "day":
          stats = {
            rows: 7,
            columns: 8,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 100,
          };
          break;
        case "week":
          stats = {
            rows: 7,
            columns: 7,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 100,
          };
          break;
        case "month":
          stats = {
            rows: 7,
            columns: graphData.labels.length,
            values: graphData.values,
            colNames: graphData.labels,
            metric: graphData.metric,
            ceil: 1,
          };
          break;
        default:
          stats = { rows: 7, columns: 7, values: [], colNames: [] };
          break;
      }
      return stats;
    } catch (error) {
      console.error("Error get day stats:", error);
      notifyError("No se pudieron cargar las estadísticas.");
      return null;
    }
  },

  getAchievements: async () => {
    try {
      const response = await rawFetch('/achievements/catalog', 'GET');
      return response.achievements || [];
    } catch (error) {
      console.error("Error fetching achievements catalog:", error);
      notifyError("No se pudieron cargar los logros.");
      return [];
    }
  },

  getItems: async () => {
    try {
      const response = await rawFetch('/shop/catalog', 'GET');
      return response.items || [];
    } catch (error) {
      console.error("Error fetching items catalog:", error);
      notifyError("No se pudo cargar la tienda.");
      return [];
    }
  },

  buyItem: async (itemId) => {
    try {
      const data = await rawFetch('/shop/buy', 'POST', { itemId });
      const result = data.data || {};
      return {
        items: result.items,
        skinsCount: result.skinsCount,
        dropsBalance: result.dropsBalance,
      };
    } catch (error) {
      if (error.message === "Sesión expirada") return null;
      console.error("Error buying item:", error);
      notifyError("Error en la compra. Revisa tu conexión o saldo.");
      return null;
    }
  },

  equipItem: async (itemId) => {
    try {
      const data = await rawFetch('/shop/equip', 'POST', { itemId });
      return data.items; 
    } catch (error) {
      if (error.message === "Sesión expirada") return null;
      console.error("Error equipping item:", error);
      notifyError("No se pudo equipar. Requiere conexión.");
      return null;
    }
  },

  syncOfflineQueue: async () => {
    // 🔒 COMPROBAR CANDADO: Si ya está sincronizando, abortamos esta llamada extra
    if (isSyncing) return false; 
    
    // Cerramos el candado inmediatamente
    isSyncing = true;

    try {
      // Retraso para dar tiempo a que la red sea estable
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const queue = await offlineManager.getQueue();
      if (queue.length === 0) return false;

      let syncCount = 0;

      for (const action of queue) {
        try {
          if (action.type === "LOG_WATER") {
            await rawFetch("/water/log", "POST", action.payload);
          } else if (action.type === "REVERT_LOG") {
            await rawFetch("/water/log", "DELETE");
          } else if (action.type === "UPDATE_USER") {
            const payload = toProfileUpdatePayload(action.payload);
            if (Object.keys(payload).length > 0) {
              await rawFetch("/user/profile", "PUT", payload);
            }
          }

          await offlineManager.removeFromQueue(action.id);
          syncCount++;
        } catch (error) {
          if (error.message === "Sesión expirada") {
            console.log("Sincronización detenida: Sesión expirada.");
            break;
          }
          console.error(
            `Error sincronizando acción ${action.type} (Se mantendrá en cola):`,
            error,
          );
        }
      }

      if (syncCount > 0) {
        showToast(`✅ ${syncCount} ${i18n.t("toast.syncData")}`);
        return true; // Triggers OfflineProvider onSyncSuccess → refreshUser + hydrationEpoch
      }

      return false;
      
    } finally {
      // 🔓 ABRIR CANDADO: Se ejecuta SIEMPRE al final, aunque haya fallado algo dentro del try
      isSyncing = false;
    }
  },

  deleteAccount: async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/user/account`, {
        method: 'DELETE',
        headers: headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      sessionExpiredCallback();
      return true; 
    } catch (error) {
      console.error("Error deleting account:", error);
      notifyError("No se pudo eliminar la cuenta. Revisa tu conexión.");
      return false;
    }
  },

  exportUserData: async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${API_URL}/water/export`, {
        method: 'GET',
        headers: headers,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data.logs;
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
    }
  }

};
