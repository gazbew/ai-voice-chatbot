import Orb from './orb.js';
import VoiceHandler from './voice.js';

document.addEventListener('DOMContentLoaded', () => {
    const orb = new Orb();
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    let voiceHandler = null;

    // Ain 1.0 backend API integration
    async function queryAinBackend(message) {
        try {
            const response = await fetch('https://api.ain1.ai/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (window.AIN_API_KEY || 'YOUR_AIN_API_KEY')
                },
                body: JSON.stringify({
                    messages: [{
                        role: "user",
                        content: message
                    }],
                    temperature: 0.7,
                    max_tokens: 150,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ain API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error querying Ain backend:', error);
            throw error;
        }
    }

    // Enhanced sentiment analysis with emotional context
    function analyzeSentiment(text) {
        const emotions = {
            joy: ['happy', 'great', 'wonderful', 'excellent', 'love', 'perfect', 'glad', 'thanks', 'good'],
            curiosity: ['interesting', 'tell', 'what', 'how', 'why', 'curious', 'wonder', 'explain'],
            concern: ['sorry', 'worried', 'apologize', 'unfortunately', 'issue', 'problem', 'error'],
            excitement: ['amazing', 'awesome', 'fantastic', 'incredible', 'wow', 'cool'],
            confusion: ['confused', 'unclear', 'don\'t understand', 'what do you mean'],
            neutral: ['is', 'are', 'the', 'a', 'an', 'that', 'this']
        };

        text = text.toLowerCase();
        let emotionalState = {
            intensity: 0.5,
            sentiment: 0.5,
            dominantEmotion: 'neutral'
        };

        // Calculate emotional intensity and sentiment
        let maxEmotionCount = 0;
        Object.entries(emotions).forEach(([emotion, words]) => {
            let count = words.reduce((acc, word) => {
                return acc + (text.includes(word) ? 1 : 0);
            }, 0);

            if (count > maxEmotionCount) {
                maxEmotionCount = count;
                emotionalState.dominantEmotion = emotion;
            }

            if (count > 0) {
                switch (emotion) {
                    case 'joy':
                    case 'excitement':
                        emotionalState.sentiment += count * 0.15;
                        emotionalState.intensity += count * 0.12;
                        break;
                    case 'curiosity':
                        emotionalState.sentiment += count * 0.05;
                        emotionalState.intensity += count * 0.15;
                        break;
                    case 'concern':
                    case 'confusion':
                        emotionalState.sentiment -= count * 0.1;
                        emotionalState.intensity += count * 0.2;
                        break;
                }
            }
        });

        // Text length affects intensity
        const lengthIntensity = Math.min(text.length / 100, 0.5);
        emotionalState.intensity += lengthIntensity;

        // Normalize values
        emotionalState.sentiment = Math.max(0.1, Math.min(0.9, emotionalState.sentiment));
        emotionalState.intensity = Math.max(0.3, Math.min(1.0, emotionalState.intensity));

        return emotionalState;
    }

    function onSpeechStart() {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        orb.updateMood(0.8, 0.6); // High intensity, positive sentiment when listening
    }

    function onSpeechEnd() {
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        orb.updateMood(0.4, 0.5); // Return to neutral state
    }

    async function onResult(transcript) {
        try {
            // Initial mood update for user speech
            const userEmotion = analyzeSentiment(transcript);
            orb.updateMood(userEmotion.intensity, userEmotion.sentiment);
            
            // Show processing state
            orb.updateMood(0.6, 0.7);
            
            const response = await queryAinBackend(transcript);
            
            // Analyze response sentiment and update orb
            const responseEmotion = analyzeSentiment(response);
            orb.updateMood(responseEmotion.intensity, responseEmotion.sentiment);
            
            // Speak the response
            voiceHandler.speak(response);
        } catch (error) {
            console.error('Error processing speech:', error);
            orb.updateMood(0.3, 0.2); // Error state
            voiceHandler.speak("I apologize, but I'm having trouble connecting to my brain at the moment. Please try again.");
        }
    }

    function onMoodUpdate(intensity, sentiment) {
        orb.updateMood(intensity, sentiment);
    }

    // Initialize voice handler
    voiceHandler = new VoiceHandler(onSpeechStart, onSpeechEnd, onResult, onMoodUpdate);

    // Event listeners
    startBtn.addEventListener('click', () => {
        voiceHandler.startListening();
    });

    stopBtn.addEventListener('click', () => {
        voiceHandler.stopListening();
    });

    // Initialize control panel listeners
    document.getElementById('movementIntensity').addEventListener('input', (e) => {
        orb.setMovementIntensity(parseFloat(e.target.value));
    });

    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        orb.setRotationSpeed(parseFloat(e.target.value));
    });

    document.getElementById('colorHue').addEventListener('input', (e) => {
        orb.setBaseHue(parseInt(e.target.value));
    });

    document.getElementById('pulseSpeed').addEventListener('input', (e) => {
        orb.setPulseSpeed(parseFloat(e.target.value));
    });
});
