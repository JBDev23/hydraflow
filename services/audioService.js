import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

class AudioService {
  constructor() {
    this.players = {};
    this.isMuted = false;
    this.globalVolume = 1.0;
  }

  // 1. Configurar el comportamiento del teléfono
  async init(isMutedInitialState = false, initialVolume = 0.5) {
    this.isMuted = isMutedInitialState;
    this.globalVolume = initialVolume / 100;

    try {
      await setAudioModeAsync({
        playsInSilentModeIOS: true, 
        staysActiveInBackground: false,
        shouldDuckAndroid: true, 
      });
    } catch (error) {
      console.error('Error inicializando AudioService:', error);
    }
  }

  // 2. Precargar un sonido (Es síncrono y ultra rápido en expo-audio)
  loadSound(name, requirePath) {
    try {
      if (!this.players[name]) {
        const player = createAudioPlayer(requirePath);
        
        // Aplicamos el volumen actual al cargar (si está silenciado, 0, si no, el global)
        player.volume = this.isMuted ? 0 : this.globalVolume;
        
        this.players[name] = player;
      }
    } catch (error) {
      console.error(`Error cargando el sonido ${name}:`, error);
    }
  }

  // 3. Reproducir el sonido
  playSound(name) {
    if (this.isMuted) return;
    
    const player = this.players[name];
    if (player) {
      try {
        // Asegurarnos de que el volumen es correcto antes de tocar
        player.volume = this.globalVolume;
        player.seekTo(0); 
        player.play();
      } catch (error) {
        console.error(`Error reproduciendo el sonido ${name}:`, error);
      }
    } else {
      console.warn(`Sonido '${name}' no encontrado. ¿Lo precargaste?`);
    }
  }

  // 4. Cambiar estado de silencio
  toggleMute(isMuted) {
    this.isMuted = isMuted;
    
    Object.values(this.players).forEach(player => {
        player.volume = isMuted ? 0 : this.globalVolume;
    });
  }

  // 5. NUEVO: Ajustar el volumen global
  setVolume(newVolumePercentage) {
      // Convertir de 0-100 a 0.0-1.0
      const normalizedVolume = newVolumePercentage / 100;
      this.globalVolume = normalizedVolume;

      // Si no está muteado, aplicamos el nuevo volumen a todos los reproductores ya cargados
      if (!this.isMuted) {
          Object.values(this.players).forEach(player => {
              player.volume = this.globalVolume;
          });
      }
  }

  // 6. Liberar memoria
  unloadAll() {
    Object.values(this.players).forEach(player => {
        player.remove(); 
    });
    this.players = {};
  }
}

export const audioService = new AudioService();