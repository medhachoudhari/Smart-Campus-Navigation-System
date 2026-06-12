/* ============================================================
   CampusSense AI — AI Chat + Voice Assistant
   Handles text chat with /api/chat, browser Speech Recognition
   for voice input, and speechSynthesis for voice output.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAssistant();
  initVoice();
});

/* ---------- Chat Assistant ---------- */
function initAssistant() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn   = document.getElementById('chat-send');
  const chatArea  = document.getElementById('chat-messages');

  if (!chatInput || !sendBtn || !chatArea) return;

  // Send on button click
  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) {
      sendMessage(text);
      chatInput.value = '';
    }
  });

  // Send on Enter key
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text) {
        sendMessage(text);
        chatInput.value = '';
      }
    }
  });

  // Welcome message
  appendMessage('assistant', "Hello! I'm CampusSense AI, your BIET campus navigation assistant. Ask me about campus locations, directions, or facilities!");
}

async function sendMessage(text) {
  const chatArea = document.getElementById('chat-messages');
  if (!chatArea) return;

  // Show user message
  appendMessage('user', text);

  // Show typing indicator
  const typingEl = showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });

    // Remove typing indicator
    if (typingEl) typingEl.remove();

    if (response.ok) {
      const data = await response.json();
      const reply = data.reply || 'Sorry, I could not process your request.';
      appendMessage('assistant', reply);

      // Speak the response
      speakText(reply);
    } else {
      appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
    }

  } catch (err) {
    if (typingEl) typingEl.remove();
    console.error('Chat request failed:', err);
    appendMessage('assistant', 'Unable to connect to the server. Make sure the Flask server is running.');
  }
}

function appendMessage(role, text) {
  const chatArea = document.getElementById('chat-messages');
  if (!chatArea) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${role}`;

  const label = document.createElement('div');
  label.className = 'msg-label';
  label.textContent = role === 'user' ? 'You' : 'CampusSense AI';

  const content = document.createElement('div');
  content.textContent = text;

  msgDiv.appendChild(label);
  msgDiv.appendChild(content);
  chatArea.appendChild(msgDiv);

  // Auto-scroll
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTypingIndicator() {
  const chatArea = document.getElementById('chat-messages');
  if (!chatArea) return null;

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatArea.appendChild(typing);
  chatArea.scrollTop = chatArea.scrollHeight;
  return typing;
}

/* ---------- Voice Assistant (Browser Speech Recognition) ---------- */
let recognition = null;
let isListening = false;

function initVoice() {
  const micBtn = document.getElementById('mic-btn');
  if (!micBtn) return;

  // Check for Speech Recognition support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.title = 'Speech Recognition not supported in this browser';
    micBtn.addEventListener('click', () => {
      alert('Speech Recognition is not supported in your browser. Please use Chrome or Edge.');
    });
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    // Put the transcript in the chat input and send it
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = transcript;
    }
    sendMessage(transcript);
    stopListening();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      appendMessage('assistant', 'No speech detected. Please try again.');
    } else if (event.error === 'not-allowed') {
      appendMessage('assistant', 'Microphone access denied. Please allow microphone access in your browser settings.');
    }
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };

  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      stopListening();
    } else {
      startListening();
    }
  });
}

function startListening() {
  if (!recognition) return;

  const micBtn = document.getElementById('mic-btn');
  isListening = true;

  if (micBtn) {
    micBtn.classList.add('listening');
    micBtn.title = 'Listening... Click to stop';
  }

  try {
    recognition.start();
  } catch (e) {
    // Already started
    console.warn('Recognition already started:', e);
  }
}

function stopListening() {
  const micBtn = document.getElementById('mic-btn');
  isListening = false;

  if (micBtn) {
    micBtn.classList.remove('listening');
    micBtn.title = 'Click to speak';
  }
}

/* ---------- Text-to-Speech ---------- */
function speakText(text) {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;

  // Try to use a nice voice
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha')
  );
  if (preferred) utterance.voice = preferred;

  speechSynthesis.speak(utterance);
}

/* Expose globals */
window.sendMessage = sendMessage;
window.speakText = speakText;
