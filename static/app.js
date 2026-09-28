/**
 * Aura Skincare - AI Voice Agent Controller
 * Features: High-responsiveness, true barge-in / instant interruption,
 * and robust order lookup simulation.
 */

let sessionId = "session_" + Math.random().toString(36).substring(2, 9);
let isCallActive = false;
let isCallPaused = false;
let recognition = null;
let isRecognitionRunning = false;
let restartTimeout = null;
let currentAudio = null;
let turnCount = 0;
let currentTurnId = 0; // Guard against stale in-flight audio/responses

// Barge-in & Intent Vocabulary Sets for strict interruption filtering
const BARGE_IN_COMMANDS = new Set([
  "wait", "hold", "stop", "pause", "listen", "quiet", "shh",
  "hang", "excuse", "shut", "enough", "ruko", "suno", "cancel"
]);

const INTENT_WORDS = new Set([
  "where", "track", "cancel", "status", "delivery", "pincode", "cash", "cod",
  "return", "refund", "recommend", "suggest", "order", "ord", "help", "price",
  "cost", "fee", "address", "product", "serum", "cream", "skin", "acne",
  "101", "102", "103", "brand", "brands", "derma", "men", "mens",
  "change", "replace", "shipping", "charge", "policy", "rules", "rule",
  "kahan", "kab", "kya", "milega", "batao", "pata"
]);

// Real-time Audio Visualizer
let audioCtx = null;
let analyser = null;
let micStream = null;
let visualizerAnimationId = null;

// Acoustic Echo Cancellation & Self-Hearing Protection
let lastAgentSpokenText = "";
let lastAgentSpokenTime = 0;
let lastCustomerTranscript = "";
let lastCustomerTranscriptTime = 0;
// Utterance accumulation & debounce (collects split digits like "order 10" + "3" -> "order 103")
let customerSpeechDebounceTimer = null;
let accumulatedCustomerSpeech = "";

// DOM Elements
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const pauseBtnText = document.getElementById("pause-btn-text");
const pauseBtnIcon = document.getElementById("pause-btn-icon");
const btnReset = document.getElementById("btn-reset");
const btnEnd = document.getElementById("btn-end");
const statePill = document.getElementById("state-pill");
const stateText = document.getElementById("state-text");
const voiceOrb = document.getElementById("voice-orb");
const waveform = document.getElementById("waveform");
const voiceHint = document.getElementById("voice-hint");
const transcriptBox = document.getElementById("transcript-box");
const turnCountEl = document.getElementById("turn-count");
const emptyTranscript = document.getElementById("empty-transcript");

// Modal Elements
const summaryModal = document.getElementById("summary-modal");
const jsonViewer = document.getElementById("json-viewer");
const modalTranscriptList = document.getElementById("modal-transcript-list");
const btnCloseModal = document.getElementById("btn-close-modal");
const btnModalDismiss = document.getElementById("btn-modal-dismiss");
const btnCopyJson = document.getElementById("btn-copy-json");
const copyBtnText = document.getElementById("copy-btn-text");

// States
const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
  PAUSED: "paused"
};

let currentState = STATES.IDLE;

function setState(state) {
  currentState = state;
  statePill.className = `state-pill ${state}`;
  voiceOrb.className = `voice-orb ${state}`;

  if (state === STATES.IDLE) {
    stateText.textContent = "Ready to Connect";
    waveform.classList.remove("active");
    voiceHint.innerHTML = 'Click <strong>"Start Call"</strong> to speak naturally with Aria using your microphone';
    setOrbIcon("sparkles");
  } else if (state === STATES.LISTENING) {
    stateText.textContent = "Aria is Listening...";
    waveform.classList.remove("active");
    voiceHint.innerHTML = '<span style="color: #047857; font-weight: 600;">Listening to you...</span> Speak naturally or tap a test prompt';
    setOrbIcon("mic");
  } else if (state === STATES.THINKING) {
    stateText.textContent = "Aria is Thinking...";
    waveform.classList.remove("active");
    voiceHint.innerHTML = 'Checking order database and brand policies...';
    setOrbIcon("loader-2", true);
  } else if (state === STATES.SPEAKING) {
    stateText.textContent = "Aria is Speaking...";
    waveform.classList.add("active");
    voiceHint.innerHTML = '<span style="color: #b45309; font-weight: 600;">Aria is speaking...</span>';
    setOrbIcon("volume-2");
  } else if (state === STATES.PAUSED) {
    stateText.textContent = "Mic Paused";
    waveform.classList.remove("active");
    voiceHint.innerHTML = '<span style="color: #b45309; font-weight: 600;">Microphone is paused.</span> Click <strong>"Resume Mic"</strong> when ready to speak';
    setOrbIcon("pause");
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

function setOrbIcon(iconName, spinning = false) {
  const container = document.querySelector(".orb-center");
  if (!container) return;
  container.innerHTML = `<i data-lucide="${iconName}" id="orb-icon" class="orb-icon-svg ${spinning ? 'spin-anim' : ''}"></i>`;
  if (window.lucide) {
    lucide.createIcons();
  }
}

// STOP ALL AGENT SPEECH IMMEDIATELY (BARGE-IN)
function stopAgentSpeaking() {
  currentTurnId++; // Invalidate any ongoing network requests
  lastAgentSpokenTime = Date.now();
  
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
    } catch (e) {}
    currentAudio = null;
  }
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  if (customerSpeechDebounceTimer) {
    clearTimeout(customerSpeechDebounceTimer);
    customerSpeechDebounceTimer = null;
  }
  accumulatedCustomerSpeech = "";
  
  waveform.classList.remove("active");
  if (isCallActive && !isCallPaused) {
    setState(STATES.LISTENING);
    if (!isRecognitionRunning) {
      startListening();
    }
  }
}

// PHONETIC NORMALIZER FOR SPEECH RECOGNITION VARIANTS
function normalizeTextForEcho(str) {
  if (!str) return "";
  return str.toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\border skin care\b/g, "aura skincare")
    .replace(/\border skincare\b/g, "aura skincare")
    .replace(/\baura skin care\b/g, "aura skincare")
    .replace(/\barya\b/g, "aria")
    .replace(/\baarya\b/g, "aria")
    .replace(/\bmodels\b/g, "orders")
    .replace(/\bmodals\b/g, "orders")
    .replace(/\boraderma\b/g, "aura derma")
    .replace(/\baura dermo\b/g, "aura derma")
    .replace(/\bblue dart\b/g, "bluedart")
    .replace(/\bpin code\b/g, "pincode")
    .replace(/\bsun screen\b/g, "sunscreen")
    .replace(/\s+/g, " ")
    .trim();
}

// NORMALIZES SPOKEN NUMBER PHRASES & SPACED DIGITS INTO ORDER CODES
function normalizeSpokenNumbers(text) {
  if (!text) return "";
  let t = text;

  // 103 variations (e.g. 'one zero three', 'one oh three', 'one o three', '1 0 3', '10 3')
  t = t.replace(/\b(?:one|1|ek)\s*(?:hundred|sau)?\s*(?:and)?\s*(?:zero|oh|o|naught|0)?\s*(?:three|3|teen)\b/gi, "103");
  t = t.replace(/\bone[- ]*(?:o|zero|oh)[- ]*three\b/gi, "103");
  t = t.replace(/\b1\s*0\s*3\b/g, "103");
  t = t.replace(/\b10\s*3\b/g, "103");
  t = t.replace(/\b1\s*03\b/g, "103");

  // 102 variations (e.g. 'one zero two', 'one oh two', 'one o two', '1 0 2', '10 2')
  t = t.replace(/\b(?:one|1|ek)\s*(?:hundred|sau)?\s*(?:and)?\s*(?:zero|oh|o|naught|0)?\s*(?:two|2|do)\b/gi, "102");
  t = t.replace(/\bone[- ]*(?:o|zero|oh)[- ]*two\b/gi, "102");
  t = t.replace(/\b1\s*0\s*2\b/g, "102");
  t = t.replace(/\b10\s*2\b/g, "102");
  t = t.replace(/\b1\s*02\b/g, "102");

  // 101 variations (e.g. 'one zero one', 'one oh one', 'one o one', '1 0 1', '10 1')
  t = t.replace(/\b(?:one|1|ek)\s*(?:hundred|sau)?\s*(?:and)?\s*(?:zero|oh|o|naught|0)?\s*(?:one|1|ek)\b/gi, "101");
  t = t.replace(/\bone[- ]*(?:o|zero|oh)[- ]*one\b/gi, "101");
  t = t.replace(/\b1\s*0\s*1\b/g, "101");
  t = t.replace(/\b10\s*1\b/g, "101");
  t = t.replace(/\b1\s*01\b/g, "101");

  return t;
}

// ROLLING HISTORY OF RECENT AGENT UTTERANCES
let agentUtteranceHistory = [];

function recordAgentUtterance(text) {
  if (!text) return;
  lastAgentSpokenText = text;
  lastAgentSpokenTime = Date.now();
  agentUtteranceHistory.push({
    text: text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(),
    time: Date.now()
  });
  if (agentUtteranceHistory.length > 8) {
    agentUtteranceHistory.shift();
  }
}

// CLEAN ECHO PREVENTION: Only active while Aria is speaking
// When Aria is silent, all recognized speech is 100% genuine customer speech!
function isSelfEcho(userTranscript) {
  if (!userTranscript || !userTranscript.trim()) return true;
  if (currentState === STATES.SPEAKING || currentState === STATES.THINKING || currentAudio !== null) {
    return true;
  }
  return false;
}

// SETUP SPEECH RECOGNITION WITH CONTINUOUS LISTENING FOR BARGE-IN
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported in this browser.");
    alert("Speech recognition works best in Chrome, Edge, or Brave. You can also test every feature instantly by tapping the prompt chips on the right!");
    return null;
  }

  const sr = new SpeechRecognition();
  sr.continuous = false;      // Turn-based: captures full utterance without splitting numbers
  sr.interimResults = true;   // Real-time hearing feedback while speaking
  sr.lang = "en-IN";          // Optimized for Indian English accents and numbers

  sr.onstart = () => {
    isRecognitionRunning = true;
    console.log("Speech recognition active, language:", sr.lang);
    if (isCallActive && !isCallPaused && currentState !== STATES.SPEAKING && currentState !== STATES.THINKING) {
      setState(STATES.LISTENING);
    }
  };

  sr.onresult = (event) => {
    if (!isCallActive || isCallPaused) return;
    if (currentState === STATES.SPEAKING || currentState === STATES.THINKING || currentAudio !== null) {
      return;
    }

    let interim = "";
    let final = "";

    for (let i = 0; i < event.results.length; ++i) {
      const part = event.results[i];
      if (part.isFinal) {
        final += part[0].transcript;
      } else {
        interim += part[0].transcript;
      }
    }

    // 1. Live feedback while customer speaks
    const liveText = (final || interim).trim();
    if (liveText && currentState === STATES.LISTENING) {
      const displayLive = normalizeSpokenNumbers(liveText);
      voiceHint.innerHTML = `<span class="live-hearing-badge"><i data-lucide="mic" style="width:14px;height:14px;display:inline;"></i> Hearing: "${displayLive}..."</span>`;
      if (window.lucide) lucide.createIcons();
    }

    // 2. Dispatch complete utterance when finalized
    if (final && final.trim().length >= 1) {
      const fullTranscript = normalizeSpokenNumbers(final.trim());
      console.log("Customer speech finalized:", fullTranscript);
      dispatchUtterance(fullTranscript);
    }
  };

  sr.onerror = (event) => {
    console.log("Speech recognition event:", event.error);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      isCallActive = false;
      setState(STATES.IDLE);
      alert("Microphone permission was not allowed. Please click the camera/mic icon in your browser address bar to allow microphone access, then click 'Start Call'.");
      return;
    }
    // For 'no-speech', restart quietly so mic stays open for customer
    if (isCallActive && !isCallPaused && currentState === STATES.LISTENING) {
      scheduleRestart(200);
    }
  };

  sr.onend = () => {
    isRecognitionRunning = false;
    // If Aria is not speaking/thinking and call is active, restart listening for customer
    if (isCallActive && !isCallPaused && currentState === STATES.LISTENING && !currentAudio) {
      scheduleRestart(150);
    }
  };

  return sr;
}

function dispatchUtterance(transcript) {
  if (isSelfEcho(transcript)) {
    console.log("Self-echo blocked in dispatchUtterance:", transcript);
    return;
  }

  const now = Date.now();
  // Duplicate guard: prevent sending identical text twice within 1000ms unless agent spoke in between
  if (transcript.toLowerCase() === lastCustomerTranscript.toLowerCase() && 
      (now - lastCustomerTranscriptTime) < 1000 &&
      lastCustomerTranscriptTime > lastAgentSpokenTime) {
    console.log("Duplicate utterance suppressed:", transcript);
    return;
  }

  lastCustomerTranscript = transcript;
  lastCustomerTranscriptTime = now;
  console.log("Customer speech submitted:", transcript);
  handleUserUtterance(transcript);
}

function scheduleRestart(delay = 150) {
  if (!isCallActive || isCallPaused) return;
  if (restartTimeout) clearTimeout(restartTimeout);
  restartTimeout = setTimeout(() => {
    if (isCallActive && !isCallPaused && !isRecognitionRunning) {
      startListening();
    }
  }, delay);
}

function startListening() {
  if (!isCallActive || isCallPaused || !recognition) return;
  if (isRecognitionRunning) return;
  try {
    recognition.start();
    isRecognitionRunning = true;
    if (currentState !== STATES.SPEAKING && currentState !== STATES.THINKING) {
      setState(STATES.LISTENING);
    }
  } catch (e) {
    console.log("startListening notice:", e.message);
  }
}

function stopListening() {
  if (restartTimeout) clearTimeout(restartTimeout);
  if (recognition) {
    try {
      recognition.abort();
    } catch (e) {}
    try {
      recognition.stop();
    } catch (e) {}
    isRecognitionRunning = false;
  }
}

// REAL-TIME MICROPHONE WEB AUDIO ANALYSER (DYNAMIC EQUALIZER)
async function initMicrophoneAudio() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    
    if (micStream) {
      try { micStream.getTracks().forEach(t => t.stop()); } catch(e) {}
    }

    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    const source = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    startVisualizerLoop();
  } catch (err) {
    console.warn("Microphone getUserMedia not available or rejected:", err);
  }
}

function startVisualizerLoop() {
  if (visualizerAnimationId) {
    cancelAnimationFrame(visualizerAnimationId);
  }

  const bars = waveform.querySelectorAll(".bar");
  const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

  function draw() {
    if (!isCallActive) {
      bars.forEach(bar => { bar.style.height = ""; bar.style.opacity = ""; });
      if (voiceOrb) voiceOrb.style.transform = "";
      return;
    }

    if (currentState === STATES.LISTENING && analyser) {
      waveform.classList.add("active");
      waveform.classList.add("listening-mic");
      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / (dataArray.length || 1);
      const normalized = Math.min(1, avg / 40); // Scales nicely with speech volume

      bars.forEach((bar, index) => {
        const binVal = dataArray[(index * 2) % dataArray.length] || 0;
        const h = Math.max(6, Math.min(38, 6 + (binVal / 255) * 32));
        bar.style.height = `${h}px`;
        bar.style.opacity = normalized > 0.05 ? "1" : "0.55";
      });

      // Subtle voice orb pulse matching voice volume
      if (voiceOrb) {
        if (normalized > 0.08) {
          voiceOrb.style.transform = `scale(${1 + normalized * 0.1})`;
        } else {
          voiceOrb.style.transform = "";
        }
      }
    } else if (currentState === STATES.SPEAKING) {
      waveform.classList.add("active");
      waveform.classList.remove("listening-mic");
      bars.forEach(bar => { bar.style.height = ""; bar.style.opacity = ""; });
      if (voiceOrb) voiceOrb.style.transform = "";
    } else {
      waveform.classList.remove("active");
      waveform.classList.remove("listening-mic");
      bars.forEach(bar => { bar.style.height = ""; bar.style.opacity = ""; });
      if (voiceOrb) voiceOrb.style.transform = "";
    }

    visualizerAnimationId = requestAnimationFrame(draw);
  }

  draw();
}

function togglePauseCall() {
  if (!isCallActive) return;

  if (!isCallPaused) {
    // User wants to pause the microphone
    isCallPaused = true;
    stopAgentSpeaking();
    stopListening();
    setState(STATES.PAUSED);
    btnPause.classList.add("is-paused");
    if (pauseBtnText) pauseBtnText.textContent = "Resume Mic";
    if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "play");
  } else {
    // User wants to resume the microphone
    isCallPaused = false;
    btnPause.classList.remove("is-paused");
    if (pauseBtnText) pauseBtnText.textContent = "Pause Mic";
    if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "pause");
    startListening();
  }
  if (window.lucide) {
    lucide.createIcons();
  }
}

// PROCESS USER UTTERANCE
async function handleUserUtterance(userText) {
  // 1. Immediately cut off any playing audio
  stopAgentSpeaking();

  if (isSelfEcho(userText)) {
    console.log("Self-echo blocked in handleUserUtterance:", userText);
    return;
  }
  
  const thisTurnId = ++currentTurnId;
  setState(STATES.THINKING);
  appendTranscriptMessage("customer", userText);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        message: userText
      })
    });

    // Check if interrupted while request was in-flight
    if (thisTurnId !== currentTurnId) {
      console.log("Turn discarded due to user interruption.");
      return;
    }

    const data = await res.json();
    const agentReply = data.response_text;

    appendTranscriptMessage("agent", agentReply);
    await speakText(agentReply, thisTurnId);

  } catch (err) {
    if (thisTurnId !== currentTurnId) return;
    console.error("Chat API error:", err);
    const fallbackText = "I apologize, but I had a brief connection issue. Could you please repeat that?";
    appendTranscriptMessage("agent", fallbackText);
    await speakText(fallbackText, thisTurnId);
  }
}

// SPEAK AGENT RESPONSE (Always uses Microsoft Neural Voice from /api/tts)
async function speakText(text, thisTurnId) {
  if (thisTurnId !== currentTurnId || !isCallActive) {
    return;
  }

  // 1. Prime utterance history and state immediately
  recordAgentUtterance(text);
  setState(STATES.SPEAKING);
  lastAgentSpokenText = text;
  lastAgentSpokenTime = Date.now();

  // 2. Stop mic listening while Aria speaks to ensure zero speaker bleed
  stopListening();

  try {
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text })
    });

    if (!ttsRes.ok) {
      throw new Error(`TTS server returned status ${ttsRes.status}`);
    }

    if (thisTurnId !== currentTurnId || !isCallActive) {
      return; // Interrupted while audio was downloading
    }

    const blob = await ttsRes.blob();
    const audioUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = 0.85;

    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      lastAgentSpokenTime = Date.now();

      // Clear any pending recognition buffer so Aria's final syllable doesn't bleed into customer turn
      try {
        if (recognition && isRecognitionRunning) {
          recognition.abort();
          isRecognitionRunning = false;
        }
      } catch (e) {}

      if (isCallActive && thisTurnId === currentTurnId) {
        if (isCallPaused) {
          setState(STATES.PAUSED);
        } else {
          // Wait 300ms for room reverberation to settle, then open clean listening session for customer
          setTimeout(() => {
            if (isCallActive && !isCallPaused && !currentAudio) {
              setState(STATES.LISTENING);
              startListening();
            }
          }, 300);
        }
      }
    };

    currentAudio.onerror = (e) => {
      console.error("Audio playback error:", e);
      currentAudio = null;
      if (isCallActive && thisTurnId === currentTurnId) {
        if (isCallPaused) {
          setState(STATES.PAUSED);
        } else {
          setState(STATES.LISTENING);
          startListening();
        }
      }
    };

    await currentAudio.play();

  } catch (err) {
    console.error("Neural TTS request failed:", err);
    if (isCallActive && thisTurnId === currentTurnId) {
      if (isCallPaused) {
        setState(STATES.PAUSED);
      } else {
        setState(STATES.LISTENING);
        startListening();
      }
    }
  }
}

// ADD MESSAGE TO LIVE TRANSCRIPT
function appendTranscriptMessage(role, text) {
  if (emptyTranscript) {
    emptyTranscript.style.display = "none";
  }

  const bubble = document.createElement("div");

  if (role === "system") {
    bubble.className = "chat-entry system-divider";
    bubble.innerHTML = `<div class="system-divider-pill"><i data-lucide="rotate-ccw" style="width: 14px; height: 14px; display: inline;"></i> <span>${text}</span></div>`;
    transcriptBox.appendChild(bubble);
    transcriptBox.scrollTop = transcriptBox.scrollHeight;
    if (window.lucide) {
      lucide.createIcons();
    }
    return;
  }

  bubble.className = `chat-entry ${role}`;

  const sender = document.createElement("div");
  sender.className = "sender-tag";
  if (role === "customer") {
    sender.textContent = "You (Customer)";
  } else {
    sender.innerHTML = `<i data-lucide="sparkles" style="width: 14px; height: 14px; display: inline;"></i> <span>Aria (Aura Skincare)</span>`;
  }

  const body = document.createElement("div");
  body.className = "bubble-body";
  body.textContent = text;

  bubble.appendChild(sender);
  bubble.appendChild(body);
  transcriptBox.appendChild(bubble);

  transcriptBox.scrollTop = transcriptBox.scrollHeight;

  turnCount++;
  turnCountEl.textContent = `${Math.ceil(turnCount / 2)} turns`;

  if (window.lucide) {
    lucide.createIcons();
  }
}

// START CALL
async function startCall() {
  isCallActive = true;
  isCallPaused = false;
  sessionId = "session_" + Math.random().toString(36).substring(2, 9);
  turnCount = 0;
  currentTurnId = 0;
  turnCountEl.textContent = "0 turns";
  transcriptBox.innerHTML = "";

  btnStart.disabled = true;
  btnEnd.disabled = false;
  btnPause.disabled = false;
  if (btnReset) btnReset.disabled = false;
  btnPause.classList.remove("is-paused");
  if (pauseBtnText) pauseBtnText.textContent = "Pause Mic";
  if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "pause");

  // Request mic & init live audio visualizer
  await initMicrophoneAudio();

  if (!recognition) {
    recognition = setupSpeechRecognition();
  }

  const greeting = "Hello and welcome to Aura Skincare, my name is Aria. How may I assist you with your orders or products today?";
  recordAgentUtterance(greeting); // Prime greeting in echo prevention history
  const thisTurnId = ++currentTurnId;
  appendTranscriptMessage("agent", greeting);
  await speakText(greeting, thisTurnId);
}

// RESET CALL (Refreshes conversation without ending call, while preserving history in JSON)
async function resetCall() {
  if (!isCallActive) return;

  console.log("Resetting conversation for session:", sessionId);

  // 1. Immediately cut off any playing audio
  stopAgentSpeaking();

  // 2. Unpause if paused
  if (isCallPaused) {
    isCallPaused = false;
    btnPause.classList.remove("is-paused");
    if (pauseBtnText) pauseBtnText.textContent = "Pause Mic";
    if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "pause");
  }

  // 3. Inform backend to record reset boundary while keeping transcript for JSON
  try {
    await fetch("/api/reset-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId })
    });
  } catch (e) {
    console.warn("Reset API warning:", e);
  }

  // 4. Update UI: Insert stylish reset divider into transcript
  appendTranscriptMessage("system", "Conversation was reset by Customer");
  lastAgentSpokenText = "";
  lastCustomerTranscript = "";
  turnCount = 0;
  turnCountEl.textContent = "0 turns (reset)";

  // 5. Speak fresh re-greeting
  const resetGreeting = "Conversation has been refreshed. How can I assist you with your orders or products now?";
  recordAgentUtterance(resetGreeting);
  const thisTurnId = ++currentTurnId;
  appendTranscriptMessage("agent", resetGreeting);
  await speakText(resetGreeting, thisTurnId);
}

// END CALL & SHOW SUMMARY
async function endCall() {
  isCallActive = false;
  isCallPaused = false;
  if (restartTimeout) clearTimeout(restartTimeout);
  if (visualizerAnimationId) cancelAnimationFrame(visualizerAnimationId);

  stopAgentSpeaking();
  stopListening();

  if (micStream) {
    try {
      micStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    micStream = null;
  }
  if (audioCtx) {
    try { audioCtx.close(); } catch (e) {}
    audioCtx = null;
  }
  analyser = null;

  setState(STATES.IDLE);

  btnStart.disabled = false;
  btnEnd.disabled = true;
  btnPause.disabled = true;
  if (btnReset) btnReset.disabled = true;
  btnPause.classList.remove("is-paused");
  if (pauseBtnText) pauseBtnText.textContent = "Pause Mic";
  if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "pause");

  try {
    const res = await fetch("/api/end-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId })
    });

    const data = await res.json();
    displaySummaryModal(data);
  } catch (err) {
    console.error("End call error:", err);
  }
}

// DISPLAY POST-CALL SUMMARY MODAL
function displaySummaryModal(data) {
  jsonViewer.textContent = JSON.stringify(data.summary, null, 2);

  modalTranscriptList.innerHTML = "";
  if (data.transcript && data.transcript.length > 0) {
    data.transcript.forEach((msg) => {
      const item = document.createElement("div");
      if (msg.role === "system") {
        item.className = "p-2 rounded bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5";
        item.innerHTML = `<span style="display:inline-flex; align-items:center; gap:5px; color:#b45309; font-weight:700;"><i data-lucide="rotate-ccw" style="width:12px;height:12px;display:inline;"></i> ${msg.content}</span>`;
      } else {
        item.className = "p-2 rounded bg-white border border-gray-200 text-xs mb-1.5";
        const isCust = msg.role === "customer";
        const roleColor = isCust ? "#1d4ed8" : "#065f46";
        const roleName = isCust ? "Customer" : "Aria";
        item.innerHTML = `<strong style="color: ${roleColor};">${roleName}:</strong> ${msg.content}`;
      }
      modalTranscriptList.appendChild(item);
    });
  } else {
    modalTranscriptList.innerHTML = '<em>No conversation turns recorded.</em>';
  }

  summaryModal.style.display = "flex";
  if (window.lucide) {
    lucide.createIcons();
  }
}

// INSTANT BARGE-IN VIA TEST CHIPS: KILLS ARIA'S VOICE AND RESPONDS IMMEDIATELY
window.simulateVoiceQuery = async function(text) {
  console.log("Prompt chip clicked (Instant Barge-in):", text);
  
  // 1. Instantly kill Aria's current audio
  stopAgentSpeaking();

  // If paused, unpause so user turn can proceed smoothly
  if (isCallPaused) {
    isCallPaused = false;
    btnPause.classList.remove("is-paused");
    if (pauseBtnText) pauseBtnText.textContent = "Pause Mic";
    if (pauseBtnIcon) pauseBtnIcon.setAttribute("data-lucide", "pause");
  }

  // 2. Start call session if not already active
  if (!isCallActive) {
    isCallActive = true;
    btnStart.disabled = true;
    btnEnd.disabled = false;
    btnPause.disabled = false;
    if (btnReset) btnReset.disabled = false;
    initMicrophoneAudio();
    if (!recognition) {
      recognition = setupSpeechRecognition();
    }
  }

  // 3. Immediately dispatch the new query
  await handleUserUtterance(text);
};

// Event Listeners
btnStart.addEventListener("click", startCall);
btnPause.addEventListener("click", togglePauseCall);
if (btnReset) btnReset.addEventListener("click", resetCall);
btnEnd.addEventListener("click", endCall);

// Tap orb or card to instantly interrupt Aria anytime she is speaking
function triggerInstantInterruption() {
  if (currentState === STATES.SPEAKING || currentAudio) {
    console.log("Customer triggered instant interruption of Aria.");
    stopAgentSpeaking();
    if (!isCallPaused) {
      setState(STATES.LISTENING);
      startListening();
    }
  }
}

if (voiceOrb) {
  voiceOrb.addEventListener("click", triggerInstantInterruption);
}

// Spacebar keyboard shortcut to instantly interrupt Aria
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && (e.target === document.body || e.target.tagName !== "INPUT") && isCallActive) {
    if (currentState === STATES.SPEAKING || currentAudio) {
      e.preventDefault();
      triggerInstantInterruption();
    }
  }
});

btnCloseModal.addEventListener("click", () => {
  summaryModal.style.display = "none";
});

btnModalDismiss.addEventListener("click", () => {
  summaryModal.style.display = "none";
});

btnCopyJson.addEventListener("click", () => {
  navigator.clipboard.writeText(jsonViewer.textContent);
  copyBtnText.textContent = "Copied!";
  btnCopyJson.style.background = "#dcfce7";
  btnCopyJson.style.color = "#15803d";
  setTimeout(() => {
    copyBtnText.textContent = "Copy JSON";
    btnCopyJson.style.background = "";
    btnCopyJson.style.color = "";
  }, 2000);
});

// Setup on Load
window.addEventListener("DOMContentLoaded", () => {
  setState(STATES.IDLE);

  if (window.lucide) {
    lucide.createIcons();
  }

  // Tab switching for right-column panel
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = {
    orders: document.getElementById("tab-orders"),
    beyond: document.getElementById("tab-beyond"),
    guardrails: document.getElementById("tab-guardrails"),
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Deactivate all
      tabBtns.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      Object.values(tabPanels).forEach((p) => {
        if (p) p.classList.remove("active");
      });

      // Activate clicked
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const target = tabPanels[btn.dataset.tab];
      if (target) target.classList.add("active");

      // Re-render Lucide icons inside the newly visible tab
      if (window.lucide) lucide.createIcons();
    });
  });
});
