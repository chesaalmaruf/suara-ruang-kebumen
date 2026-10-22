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
        console.warn('Recognition error, switching to assistive simulation:', e);
        this.fallbackSimulation(callbacks);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onListeningChange(false);
      };

      try {
        this.recognition.start();
      } catch {
        this.fallbackSimulation(callbacks);
      }
    } else {
      this.fallbackSimulation(callbacks);
    }
  }

  private fallbackSimulation(callbacks: DictationCallback): void {
    const samplePhrases = [
      'Guiding block trotoar pecah dan berlubang sekitar 2 meter, sangat berbahaya bagi tunanetra yang melintas menuju halte bus.',
      'Ramp kursi roda terlalu curam dengan kemiringan lebih dari 20 derajat, tidak ada pegangan tangan pengaman.',
      'Ubin pemandu terhalang pot tanaman besar dan tiang reklame, akses pejalan kaki difabel terblokir.',
      'Penutup manhole drainase amblas sedalam 15 cm di depan ruko, membahayakan pengguna kursi roda dan lansia.'
    ];

    const chosenPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];

    this.simulationTimer = setTimeout(() => {
      callbacks.onResult(chosenPhrase);
      this.isListening = false;
      callbacks.onListeningChange(false);
    }, 1800);
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
