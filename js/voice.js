class VoiceHandler {
    constructor(onSpeechStart, onSpeechEnd, onResult, onMoodUpdate) {
        this.recognition = null;
        this.synth = window.speechSynthesis;
        this.onSpeechStart = onSpeechStart;
        this.onSpeechEnd = onSpeechEnd;
        this.onResult = onResult;
        this.onMoodUpdate = onMoodUpdate;
        this.isListening = false;
        this.initRecognition();
    }

    initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition API not supported in this browser.');
            return;
        }
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.continuous = false;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onSpeechStart) this.onSpeechStart();
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onSpeechEnd) this.onSpeechEnd();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.onResult) this.onResult(transcript);
            // Simulate mood update based on speech length
            if (this.onMoodUpdate) {
                const intensity = Math.min(transcript.length / 100, 1);
                const sentiment = 0.5 + 0.5 * Math.sin(Date.now() / 1000);
                this.onMoodUpdate(intensity, sentiment);
            }
        };
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    speak(text) {
        if (!this.synth) return;
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Add event handlers for better mood transitions
        utterance.onstart = () => {
            if (this.onMoodUpdate) {
                this.onMoodUpdate(0.7, 0.6); // Active speaking state
            }
        };

        utterance.onboundary = (event) => {
            if (this.onMoodUpdate) {
                // Subtle variations during speech
                const progress = event.charIndex / text.length;
                const intensity = 0.6 + Math.sin(progress * Math.PI) * 0.2;
                const sentiment = 0.6 + Math.cos(progress * Math.PI) * 0.1;
                this.onMoodUpdate(intensity, sentiment);
            }
        };

        utterance.onpause = () => {
            if (this.onMoodUpdate) {
                this.onMoodUpdate(0.3, 0.5); // Paused state
            }
        };

        utterance.onresume = () => {
            if (this.onMoodUpdate) {
                this.onMoodUpdate(0.7, 0.6); // Resume speaking
            }
        };

        utterance.onend = () => {
            if (this.onMoodUpdate) {
                this.onMoodUpdate(0.4, 0.5); // Return to idle state
            }
        };

        utterance.onerror = () => {
            if (this.onMoodUpdate) {
                this.onMoodUpdate(0.2, 0.3); // Error state
            }
        };

        this.synth.speak(utterance);
    }
}

export default VoiceHandler;
