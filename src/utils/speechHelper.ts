/**
 * Speech synthesis & recognition helper for SUARA RUANG accessibility
 */

export function speakText(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding an Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
    if (idVoice) {
      utterance.voice = idVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Web Speech Recognition helper with fallback simulation for sandbox environments
 */
export interface DictationCallback {
  onResult: (text: string) => void;
  onListeningChange: (isListening: boolean) => void;
  onError?: (error: string) => void;
}

export class DictationService {
  private recognition: any = null;
  private isListening: boolean = false;
  private simulationTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.lang = 'id-ID';
          this.recognition.continuous = false;
          this.recognition.interimResults = false;
        } catch {
          this.recognition = null;
        }
      }
    }
  }

  start(callbacks: DictationCallback): void {
    if (this.isListening) {
      this.stop(callbacks);
      return;
    }

    this.isListening = true;
    callbacks.onListeningChange(true);

    if (this.recognition) {
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        callbacks.onResult(transcript);
        this.isListening = false;
        callbacks.onListeningChange(false);
      };

      this.recognition.onerror = (e: any) => {
        this.isListening = false;
        callbacks.onListeningChange(false);
        callbacks.onError?.(
          e?.error === 'not-allowed'
            ? 'Izin mikrofon ditolak. Silakan aktifkan izin mikrofon pada browser Anda.'
            : 'Dikte suara gagal menangkap audio. Silakan coba lagi atau ketik manual.'
        );
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onListeningChange(false);
      };

      try {
        this.recognition.start();
      } catch {
        this.isListening = false;
        callbacks.onListeningChange(false);
        callbacks.onError?.('Tidak dapat memulai mikrofon pada browser ini.');
      }
    } else {
      this.isListening = false;
      callbacks.onListeningChange(false);
      callbacks.onError?.(
        'Browser perangkat ini belum mendukung dikte suara. Silakan ketik deskripsi secara manual.'
      );
    }
  }

  stop(callbacks: DictationCallback): void {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.isListening = false;
    callbacks.onListeningChange(false);
  }
}
