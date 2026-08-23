import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type SoundName =
  'drink' | 'swipe' | 'levelUp' | 'achievement' | 'goalReached' | 'equipItem' | 'buyItem';

class AudioService {
  private players: Partial<Record<SoundName, AudioPlayer>> = {};
  private isMuted = false;
  private globalVolume = 1.0;

  async init(isMutedInitialState = false, initialVolume = 0.5): Promise<void> {
    this.isMuted = isMutedInitialState;
    this.globalVolume = initialVolume / 100;

    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });
    } catch (error) {
      console.error('Error inicializando AudioService:', error);
    }
  }

  loadSound(name: SoundName, requirePath: number): void {
    try {
      if (!this.players[name]) {
        const player = createAudioPlayer(requirePath);
        player.volume = this.isMuted ? 0 : this.globalVolume;
        this.players[name] = player;
      }
    } catch (error) {
      console.error(`Error cargando el sonido ${name}:`, error);
    }
  }

  playSound(name: SoundName): void {
    if (this.isMuted) return;

    const player = this.players[name];
    if (player) {
      try {
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

  toggleMute(isMuted: boolean): void {
    this.isMuted = isMuted;

    Object.values(this.players).forEach((player) => {
      if (player) {
        player.volume = isMuted ? 0 : this.globalVolume;
      }
    });
  }

  setVolume(newVolumePercentage: number): void {
    const normalizedVolume = newVolumePercentage / 100;
    this.globalVolume = normalizedVolume;

    if (!this.isMuted) {
      Object.values(this.players).forEach((player) => {
        if (player) {
          player.volume = this.globalVolume;
        }
      });
    }
  }

  unloadAll(): void {
    Object.values(this.players).forEach((player) => {
      player?.remove();
    });
    this.players = {};
  }
}

export const audioService = new AudioService();
