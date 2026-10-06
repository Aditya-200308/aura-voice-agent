# 🎬 Aura Skincare Voice Agent — Complete Demo Video Script

> **Candidate**: Aditya Suvarna  
> **Role**: AI + Tech Intern / Full Stack AI Developer Intern — Datastraw Technologies  
> **Application**: Aura Skincare AI Voice Customer Support Agent ("Aria")  
> **Target Video Length**: ~3:30 – 4:00 Minutes  
> **Core Engine**: Google Gemini 3.8 Flash (Async `client.aio` with 2.5s Timeout) + Web Audio API Turn-Taking

---

## 🛠️ Recording Setup Checklist (Do This Before Clicking Record)

1. **Screen Recorder**: Press <kbd>Win</kbd> + <kbd>Alt</kbd> + <kbd>R</kbd> (Windows built-in recorder) or open [Loom](https://www.loom.com).
2. **Browser Tab 1**: Open your application at `http://localhost:8000/` (or your live public tunnel URL).
3. **Browser Tab 2**: Open your GitHub repository [`README.md`](https://github.com/Aditya-200308/aura-voice-agent#readme), scrolled down to the **Architecture Diagram**.
4. **Microphone**: Ensure your headset/microphone is selected and unmuted in your browser.
5. **Mouse Pointer**: Keep your cursor active to highlight the model badge, voice orb equalizer, call buttons, and evaluator panel.

---

## ⏱️ Video Timeline at a Glance

| Section | Timestamp | Action & Topics Covered |
| :--- | :--- | :--- |
| **Part 1** | **0:00 – 0:45** | **Introduction & UI Tour**: Project context, Gemini 3.8 Flash badge, Voice Orb, 4 Call Control buttons, and Evaluator Helper panel. |
| **Part 2** | **0:45 – 1:30** | **Live Voice Turn 1 (Order Lookup & Policy)**: Click *Start Call*, speak naturally: *"Tell me about order ORD-103"*. Aria fetches packing status via real-time tool calling. Follow up with shipping policy. |
| **Part 3** | **1:30 – 2:15** | **Live Voice Turn 2 (Policy Guardrail)**: Speak: *"Can you please cancel order ORD-103?"*. Demonstrate atomic turn-taking, cancellation eligibility check, and instant confirmation. |
| **Part 4** | **2:15 – 2:45** | **Live Voice Turn 3 (Out-of-Scope Guardrail)**: Speak: *"Can you book me a flight to Mumbai?"*. Aria enforces strict brand boundaries and gracefully steers back. |
| **Part 5** | **2:45 – 3:20** | **Call Controls & Post-Call Telemetry**: Click *End Call & Generate Summary*. Inspect full transcript and structured CRM JSON outcome. |
| **Part 6** | **3:20 – 4:00** | **Architecture & Engineering Deep-Dive**: Switch to README diagram; explain Gemini 3.8 Flash async client (`client.aio`), 2.5s fail-fast timeout, atomic turn locks, and edge-tts neural voice. |

---

## 🎙️ Word-for-Word Video Script

---

### PART 1: Introduction & UI Buttons Tour (0:00 – 0:45)

**🖥️ On Screen**: Browser Tab 1 showing the Aura Skincare application. Hover your cursor over the header, model badge, Voice Orb, Call Controls, and Evaluator Panel.

**🗣️ Speak out loud**:
> *"Hi everyone, my name is Aditya Suvarna. Today I'm excited to present my submission for the AI and Full Stack Developer Intern assessment at Datastraw Technologies.*
> 
> *I built **Aria**, an intelligent, browser-based AI Voice Customer Support Specialist for **Aura Skincare**, a premium organic Indian D2C brand.*
> 
> *Before we start our live call, let's take a quick 15-second tour of the interface:*
> *(Point mouse at each component)*
> - *At the top, we have our **Dynamic State Indicator** and **Pulsing Voice Orb** with an animated audio equalizer.*
> - *Notice the badge showing our primary LLM: **Google Gemini 3.8 Flash**, running on an asynchronous, fail-fast event loop.*
> - *Directly beneath are our four **Call Control Buttons**: **Start Call** to initialize audio, **Pause Mic** to mute/unmute during a call, **Reset Call** to clear conversation context while preserving telemetry, and **End Call & Generate Summary**.*
> - *On the right, we have an **Evaluator Helper Panel** with active orders from our mock database and **1-Click Action Chips** (like testing ORD-103 cancellation or return policies) so anyone can evaluate the system even in a quiet room.*
> 
> *Now, let's click **Start Call** to begin our live voice session."*

---

### PART 2: Live Voice — Order 103 Status & Policy Lookup (0:45 – 1:30)

**🖥️ On Screen**: Click the green **"Start Call"** button. The state pill changes to `Listening` (green) / `Speaking` (blue).

**Aria greets you**:
> *"Hello and welcome to Aura Skincare, my name is Aria. How may I assist you with your orders or products today?"*

**🗣️ Speak clearly into your mic**:
> **"Hi Aria, can you tell me about order ORD-103?"**

*(**Pacing Note**: Pause naturally after speaking this first phrase. Notice how the frontend atomic lock (`isProcessingUtterance`) guards the turn, cleanly transitioning `Listening` ➔ `Thinking` (yellow) ➔ `Speaking` (blue). Aria speaks back)*:
> *"Order ORD-103 for Ananya Patel is currently processing and being packed. It was placed recently and is eligible for cancellation if needed."*

*(Once Aria finishes speaking, seamlessly move to the next phrase)*:
**🗣️ Speak clearly into your mic**:
> **"What are your shipping charges?"**

*(Aria responds instantly with exact D2C policy)*:
> *"We offer free delivery on all orders above ₹499. For orders below ₹499, a standard shipping fee of ₹50 applies, with delivery usually within 3 to 5 business days."*

**🗣️ Explain to the Viewer**:
> *"As you can see, Aria retrieved Ananya Patel's order details from our database via real-time tool calling and answered our shipping policy query without delay.*
> 
> *Notice how cleanly the conversational turns handled the natural pause between phrases: our frontend utilizes an atomic utterance lock (`isProcessingUtterance`) that discards overlapping noise while processing, and our backend executes Gemini 3.8 Flash asynchronously via `client.aio` with a strict 2.5-second timeout and deterministic fallback net. There is zero speech overlap, and the event loop never stalls."*

---

### PART 3: Guardrail — Order Cancellation (1:30 – 2:15)

**🗣️ Speak clearly into your mic**:
> **"Can you please cancel order ORD-103 for me?"**

*(Pause naturally. Aria executes the cancellation tool call and speaks back)*:
> *"Your order ORD-103 has been successfully cancelled as it was still in processing. A confirmation has been sent to your registered contact."*

**🗣️ Explain to the Viewer**:
> *"Notice the policy guardrail here: under Aura Skincare's D2C policy, orders are only eligible for cancellation while in 'Processing' status. Because order 103 was still being packed, Aria verified the condition, executed the `cancel_order` tool, and confirmed the cancellation immediately without hallucinating or making assumptions."*

---

### PART 4: Out-of-Scope Guardrail — "Book me a flight" (2:15 – 2:45)

**🗣️ Speak clearly into your mic**:
> **"Can you book me a flight to Mumbai?"**

*(Aria immediately enforces brand boundaries and speaks back)*:
> *"I can only assist with Aura Skincare orders, products, and policies. Is there anything regarding your order or our skincare range I can help with?"*

**🗣️ Explain to the Viewer**:
> *"This demonstrates our out-of-scope guardrail. When a user asks an irrelevant or adversarial question—like booking flights or asking general trivia—Aria politely declines, stays within her system prompt boundaries, and gracefully steers the user back to Aura Skincare products and orders."*

---

### PART 5: Call Controls in Action — End Call & JSON Telemetry (2:45 – 3:20)

**🖥️ On Screen**: Click the red button **"End Call & Generate Summary"**. The post-call modal pops up immediately with the transcript and JSON telemetry.

**🗣️ Explain to the Viewer** *(Point cursor at the transcript and JSON viewer)*:
> *"Now let's click the red **'End Call & Generate Summary'** button to view our post-call analytics.*
> 
> *On the left, we have the complete, chronological dialogue transcript capturing every turn between the customer and Aria.*
> 
> *On the right, our backend automatically synthesized this interaction into a clean, structured JSON payload ready for CRM ingestion:*
> - *`customer_intent`: Correctly categorized as `MULTI_INQUIRY_SUPPORT` because we checked status, verified shipping, requested cancellation, and asked an out-of-scope question.*
> - *`order_id` and `orders_discussed`: Accurately captured as `ORD-103`.*
> - *`resolution_status`: Marked as `RESOLVED`.*
> - *`call_summary`: A concise, human-readable summary detailing the status check, successful cancellation, and polite out-of-scope redirection.*
> - *And `total_conversation_turns` accurately tracks our complete multi-turn interaction."*

---

### PART 6: Architecture Walkthrough & Outro (3:20 – 4:00)

**🖥️ On Screen**: Switch to Tab 2 showing the **Architecture Diagram** in [`README.md`](https://github.com/Aditya-200308/aura-voice-agent#readme).

**🗣️ Speak out loud**:
> *"Finally, let's take a quick look at the architecture powering Aria.*
> 
> *The entire solution runs as a unified, high-performance stack:*
> 1. **Client Tier**: Built with vanilla HTML5, CSS, and modern JavaScript with zero build tool bloat. It features the Web Speech API configured for Indian English (`en-IN`), an atomic `isProcessingUtterance` turn lock to prevent cross-talk, and an unlocked Web Audio API pipeline that eliminates browser autoplay blocks.
> 2. **Backend API**: Powered by Python FastAPI with asynchronous endpoints for `/api/chat`, `/api/tts`, and `/api/end-call`.
> 3. **Dual-Layer Intelligence**: Powered by **Google Gemini 3.8 Flash** using the asynchronous `client.aio` SDK with a strict 2.5-second timeout for snappy, sub-second responses, backed by an offline **Deterministic Guardrail Engine** that guarantees 100% policy compliance even if upstream model APIs experience latency spikes.
> 4. **Neural Speech Synthesis**: Uses Microsoft's expressive neural voice models via `edge-tts` to deliver a warm, human Indian persona at sub-second latency with zero per-minute API fees.*
> 
> *In line with Section 6 of the assessment guidelines, I utilized Google's Antigravity IDE and Gemini to rapidly prototype, debug, and stress-test this pipeline while maintaining strict first-principles engineering ownership.*
> 
> *Thank you to the Datastraw Technologies team for reviewing my submission. I look forward to your feedback!"*

---

## 💡 Quick Tips for a Flawless Recording
- **Tone**: Speak naturally and at a calm, conversational pace.
- **Natural Pause**: When speaking (*"Can you tell me about order ORD-103?"*), pause naturally and let Aria finish speaking before moving to the next query. The atomic lock and async event loop handle state transitions seamlessly!
- **Mouse Cues**: Hover over the **Start Call** button, the **Gemini 3.8 Flash badge**, the **State Pill**, and the **CRM JSON fields** to guide the evaluator's eyes.
