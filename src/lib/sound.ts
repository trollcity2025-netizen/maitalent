export class SoundManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.loadSettings();
  }

  private loadSettings() {
    const saved = localStorage.getItem('maitalent_notifications_enabled');
    this.enabled = saved === null ? true : JSON.parse(saved);
  }

  private saveSettings() {
    localStorage.setItem('maitalent_notifications_enabled', JSON.stringify(this.enabled));
  }

  private async createAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.3; // Moderate volume
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  async playCalledUpSound() {
    if (!this.enabled) return;

    try {
      await this.createAudioContext();
      
      if (this.audioContext!.state === 'suspended') {
        await this.audioContext!.resume();
      }

      // Create a pleasant notification sound
      const oscillator = this.audioContext!.createOscillator();
      const now = this.audioContext!.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);

      const gainNode = this.audioContext!.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode!);

      oscillator.start(now);
      oscillator.stop(now + 0.3);

    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  vibrate() {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  enableNotifications() {
    this.enabled = true;
    this.saveSettings();
  }

  disableNotifications() {
    this.enabled = false;
    this.saveSettings();
  }

  toggleNotifications() {
    this.enabled = !this.enabled;
    this.saveSettings();
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();