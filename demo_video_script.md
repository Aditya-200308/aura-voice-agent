# 🎬 Aura Skincare Voice Agent — 3–5 Minute Demo Video Script

> **Submission for**: Datastraw Technologies — AI + Tech Intern / Full Stack AI Developer Intern  
> **Candidate**: Aditya Suvarna  
> **Application URL**: `http://localhost:8000/`  
> **Target Duration**: 3:30 – 4:30 Minutes

---

## 🛠️ Recording Setup Checklist (Do This Before Starting)

1. **Screen Recorder**:
   - **Windows Built-in**: Press `Win + Alt + R` to instantly start recording (or `Win + G` for Xbox Game Bar).
   - **Alternative**: [Loom](https://www.loom.com/) or [OBS Studio](https://obsproject.com/).
2. **Browser Window**:
   - Open **`http://localhost:8000/`** in Google Chrome or Microsoft Edge.
   - Zoom to 100% or 110% for crisp readability.
   - Close other tabs to keep the presentation clean.
3. **Second Window / Tab**:
   - Have [`README.md`](file:///C:/Users/ADITYA/.gemini/antigravity-ide/scratch/aura-voice-agent/README.md) open in VS Code or in GitHub to quickly show the architecture diagram during the walkthrough.

---

## ⏱️ Video Timeline at a Glance

| Segment | Time | Content |
|---|---|---|
| **1. Introduction** | 0:00 – 0:30 | Project intro, role, brand context, and high-level tech stack |
| **2. Live Voice & Order Lookup** | 0:30 – 1:20 | Start Call, natural conversation with Aria, real-time tracking for `ORD-101` |
| **3. Policy Guardrails & D2C Rules** | 1:20 – 2:20 | Test cancellation policy, COD threshold (₹2,500), and shipping rules |
| **4. Post-Call Telemetry & JSON** | 2:20 – 3:00 | Click "End Call", inspect transcript & structured JSON summary |
| **5. Architecture & Section 9** | 3:00 – 3:45 | Walk through FastAPI backend, Gemini function calling, edge-tts, and resiliency |
| **6. Conclusion** | 3:45 – 4:00 | Wrap up and sign off |

---

## 🎙️ Word-for-Word Script & Screen Actions

### Part 1: Introduction (0:00 – 0:30)

**On Screen**: Web browser showing the Aura Skincare landing page at `http://localhost:8000/`.

**What to Say**:
> *"Hi everyone, my name is Aditya Suvarna. Today I'm excited to present my submission for the AI and Full Stack Developer Intern assessment at Datastraw Technologies.*
> 
> *I built **Aria**, an end-to-end AI Voice Customer Support Specialist for **Aura Skincare**, a premium organic Indian D2C brand.*
> 
> *The system features real-time Indian English speech recognition, neural voice synthesis, dynamic order tracking with function calling, strict brand guardrails, and automatic post-call telemetry. Let's jump straight into the live demo."*

---

### Part 2: Live Voice Conversation & Order Lookup (0:30 – 1:20)

**On Screen**: Click the **Start Call** button. The state pill transitions to 🟢 `Listening` / 🔵 `Speaking`, and the voice orb activates.

**Aria speaks**:
> *"Hello and welcome to Aura Skincare, my name is Aria. How may I assist you with your orders or products today?"*

**What to Speak into Your Mic**:
> 🗣️ **"Hi Aria, where is my order ORD-101?"**

**Aria responds**:
> *"Order ORD-101 for Priya Sharma is currently out for delivery via BlueDart. It is scheduled to reach your doorstep by 6 PM today."*

**What to Say to the Viewer**:
> *"As you can see, Aria triggered a tool call to our database to fetch Priya's order details, courier tracking, and ETA in real time, responding in a concise, spoken-friendly format."*

---

### Part 3: Policy Guardrails & D2C Rules (1:20 – 2:20)

**What to Speak into Your Mic**:
> 🗣️ **"Can I cancel order ORD-101?"**

**Aria responds**:
> *"I am sorry, but order ORD-101 is already out for delivery and cannot be cancelled at this stage. You may refuse delivery at your doorstep if you no longer wish to receive it."*

**What to Say to the Viewer**:
> *"Notice the guardrail: orders can only be cancelled while in Processing status. Aria politely enforces the policy without hallucinating."*

**Next: Show COD Limit Guardrail**:
**What to Speak into Your Mic**:
> 🗣️ **"Can I pay cash on delivery for 3,000 rupees?"**

**Aria responds**:
> *"I am sorry, but Cash on Delivery is not available for orders above ₹2,500. Your order of ₹3,000 exceeds this limit, so you would need to pay online via UPI, credit card, or debit card at checkout."*

**Next: Show Processing Cancellation**:
**What to Speak into Your Mic**:
> 🗣️ **"Can you cancel order ORD-103?"**

**Aria responds**:
> *"Your order ORD-103 has been successfully cancelled as it was still in processing. A confirmation has been sent to your registered contact."*

**What to Say to the Viewer**:
> *"Notice how cleanly the guardrails operate: Aria accurately differentiates between processing and in-transit orders, enforces our ₹2,500 COD threshold, and provides immediate resolution."*

---

### Part 4: Post-Call Telemetry & Structured JSON Summary (2:20 – 3:00)

**On Screen**: Click the red button **"End Call & Generate Summary"**. The summary modal pops up with the JSON viewer and transcript.

**What to Say to the Viewer**:
> *"Now I'll end the call to view the post-call analytics.*
> 
> *Our system generates a full conversation audit and a structured JSON payload ready for CRM ingestion:*
> - *`customer_intent`: Correctly identified as `MULTI_INQUIRY_SUPPORT` because we covered both order tracking and payment policies.*
> - *`orders_discussed`: Accurately logged as `['ORD-101']` without confusing rupee amounts.*
> - *`resolution_status`: Marked as `POLICY_EXPLAINED`.*
> - *`call_summary`: A concise, human-readable summary of everything discussed and resolved.*
> - *We can also 1-click copy this JSON or review the chronological transcript on the left."*

---

### Part 5: Architecture Walkthrough (3:00 – 3:45)

**On Screen**: Switch to VS Code or GitHub showing the [Architecture Diagram](file:///C:/Users/ADITYA/.gemini/antigravity-ide/scratch/aura-voice-agent/README.md#L55-L75).

**What to Say to the Viewer**:
> *"Let's take a quick look at the architecture behind this.*
> 
> *The solution uses a high-performance, single-unit stack:*
> 1. **Client Tier**: Built with vanilla HTML5, CSS, and modern JavaScript with zero build overhead. It handles the Web Speech API in Indian English (`en-IN`), Web Audio API playback, and turn-based acoustic isolation.
> 2. **Backend API**: Powered by Python FastAPI with asynchronous endpoints for `/api/chat`, `/api/tts`, and `/api/end-call`.
> 3. **Dual-Layer Intelligence**:
>    - Uses **Google Gemini 2.5 Flash** with native function calling for natural conversational reasoning.
>    - Backed by an offline **Deterministic Guardrail Engine** (`_resilient_policy_engine`) that guarantees 100% policy compliance even if API keys expire or networks fluctuate.
> 4. **Neural Speech Synthesis**: Uses Microsoft's neural voices via `edge-tts` to deliver a warm, expressive Indian persona at sub-second streaming latency at zero operational cost."*

---

### Part 6: Outro (3:45 – 4:00)

**On Screen**: Return to the browser showing the clean Aura Skincare UI.

**What to Say to the Viewer**:
> *"The entire codebase is fully documented on GitHub, complete with setup instructions, `.env.example`, Section 9 responses, and a public live deployment.*
> 
> *Thank you to the team at Datastraw Technologies for reviewing my submission. I look forward to discussing this further!"*

---

## 🎯 Tips for a Flawless Recording

- **Speak clearly at a normal conversational volume** about 1 foot away from your laptop microphone.
- If you stumble, you don't need to re-record the whole video—just pause for 2 seconds and repeat that sentence.
- Keep your mouse pointer visible and point to the elements (Voice Orb, State Pill, JSON Summary) as you speak about them.
