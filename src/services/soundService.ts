/**
 * SoundService - Handles procedural audio and voice feedback for the application.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Short click sound for tactile feedback.
   */
  playClick() {
    try {
      this.initCtx();
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx!.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx!.currentTime + 0.05);

      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start();
      osc.stop(this.ctx!.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  /**
   * High-pitch double chime for income/credits.
   */
  playIncome() {
    try {
      this.initCtx();
      const now = this.ctx!.currentTime;
      
      const playChime = (time: number, freq: number) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.2);
      };

      playChime(now, 880); // A5
      playChime(now + 0.1, 1320); // E6
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  /**
   * Deduction sound for expenses.
   */
  playSpend() {
    try {
      this.initCtx();
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.ctx!.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx!.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start();
      osc.stop(this.ctx!.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  /**
   * Voice announcement using Web Speech API - DISABLED as per user request for SFX-only feedback.
   */
  announce(text: string) {
    // console.log("Announcement suppressed:", text);
  }
}

export const sound = new SoundService();
