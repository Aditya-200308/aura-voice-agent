# 🌿 Aura Skincare — AI Voice Customer Support Agent (Aria)

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.8%20%2F%20Flash-8E75C2.svg)](https://ai.google.dev/)
[![Voice](https://img.shields.io/badge/TTS-Aria%20Neural%20Voice-success.svg)](https://github.com/rany2/edge-tts)

An end-to-end, browser-based AI Voice Customer Support Agent built for **Aura Skincare**, a premium organic Indian D2C brand. Built for the **Datastraw Technologies AI + Tech Intern / Full Stack AI Developer Intern** assessment.

Evaluators can click **"Start Call"**, speak naturally with **Aria** (an Indian customer support specialist), check real-time order tracking, test cancellation policies, and review structured post-call telemetry.

> 🌐 **Live Public Application URL**:  
> **[https://wallace-ultimate-surrounded-premiere.trycloudflare.com](https://wallace-ultimate-surrounded-premiere.trycloudflare.com)**  
> *(Open in Google Chrome or Microsoft Edge, allow microphone access, and speak directly with Aria).*

---

## 🌟 Key Features

1. **Natural Indian Persona ("Aria")**:
   - Spoken interaction with natural Indian English cadence using Microsoft's neural voice models for Aria.
   - Concise, spoken-friendly responses (1–3 sentences) avoiding robotic essays or markdown clutter.
   - Text normalization: converts currency (`₹699` $\rightarrow$ *"Rupees 699"*) and spells out order IDs (`ORD-101` $\rightarrow$ *"O-R-D 1 0 1"*).

2. **Order Lookup with Tool / Function Calling**:
   - Native Python function calling:
     - `get_order_details(order_id)`: Fetches real-time status, tracking courier (BlueDart / Delhivery), and ETAs.
     - `cancel_order(order_id)`: Enforces Aura Skincare's cancellation policies.
   - Resilient ID normalization: Automatically matches variations like `"ORD-101"`, `"ord 101"`, `"101"`, or speech transcribed without dashes.

3. **Strict Brand Policies & Guardrail Engine**:
   - **Returns Policy**: Accepts returns within 7 days *only for unopened/unused* items in original packaging. Rejects requests for opened products or those exceeding 7 days.
   - **Cancellation Policy**: Orders can only be cancelled while in `Processing` status (`ORD-103`). Rejects cancellation for `Out for Delivery` (`ORD-101`) or `Delivered` (`ORD-102`), explaining they may refuse at the doorstep.
   - **Shipping & COD**: Free shipping above ₹499 (₹50 fee below); COD available up to ₹2,500.
   - **Out-of-Scope Protection**: Gracefully redirects non-skincare queries (e.g., flight bookings, weather).

4. **Live State Indicators & Natural Turn-Taking**:
   - Clear visual indicator: `Ready` ⚪ | `Listening` 🟢 | `Thinking` 🟡 | `Speaking` 🔵.
   - Dynamic pulsing voice orb and animated audio equalizer.
   - Smooth turn-taking: Visual feedback and mic coordination ensure crisp conversation without echo.

5. **Evaluator-Friendly Testing Panel**:
   - On-screen quick test cards for `ORD-101`, `ORD-102`, and `ORD-103`.
   - 1-click test prompt chips to simulate queries instantly without a microphone.

6. **Structured Post-Call Summary**:
   - Generates chronological transcript and structured JSON outcome:
     ```json
     {
       "customer_intent": "ORDER_TRACKING",
       "order_id": "ORD-101",
       "resolution_status": "RESOLVED",
       "call_summary": "Customer asked about the delivery status of ORD-101. The order is out for delivery and expected by 6 PM today."
     }
     ```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser Client (Vanilla HTML5 / CSS3 / ES6)                │
│  • Web Speech API (STT - Indian English 'en-IN')            │
│  • Voice Orb & Waveform State Visualizer                    │
│  • Test Orders Card (ORD-101, 102, 103) + 1-Click Prompts   │
│  • HTML5 Audio Player with Smooth Turn-Taking               │
└──────────────────────────────▲──────────────────────────────┘
                               │ REST / Audio Stream
┌──────────────────────────────▼──────────────────────────────┐
│  FastAPI Backend (Python 3.10+)                             │
│  ├── POST /api/chat     → Gemini LLM / Policy Guardrails    │
│  │                        └── Tool Calls: get_order, cancel │
│  ├── POST /api/tts      → edge-tts (Aria Neural MP3)        │
│  ├── POST /api/end-call → Structured JSON Summary Extractor │
│  └── GET  /api/orders   → Mock Order Database               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10 or higher
- Google Gemini API Key (optional — system includes an offline resilient policy engine)

### 1. Set Up Virtual Environment
```bash
git clone <your-repo-url>
cd aura-voice-agent

# Create virtual environment
python -m venv .venv

# Activate on Windows
.\.venv\Scripts\activate

# Activate on macOS/Linux
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
PORT=8000
```
*(Note: If you leave `GEMINI_API_KEY` blank, the app will run with its built-in rule-based guardrail fallback engine, guaranteeing 100% testability offline!)*

### 4. Run the Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open **`http://localhost:8000`** in Google Chrome or Microsoft Edge. Allow microphone access when prompted.

---

## 🧪 Testing Guide for Evaluators

| Test Scenario | Sample Utterance | Expected Agent Behavior |
| :--- | :--- | :--- |
| **Order Tracking** | *"Where is my order ORD-101?"* | Calls `get_order_details`. Reports BlueDart courier and expected delivery by 6 PM today. |
| **Invalid Cancellation** | *"I want to cancel order ORD-101"* | Calls `cancel_order`. Rejects cancellation because status is `Out for Delivery`. Advises customer to refuse delivery at doorstep. |
| **Valid Cancellation** | *"Can you please cancel ORD-103?"* | Calls `cancel_order`. Successfully cancels the order because status is `Processing`. |
| **Return Policy Enforcement** | *"I bought this 20 days ago and have opened it. Can I return it?"* | Rejects return. Explains policy: returns only within 7 days for *unopened* products. |
| **Shipping Policy** | *"How much is shipping to Mumbai?"* | Explains free shipping above ₹499, ₹50 fee below ₹499, 3–5 business days delivery. |
| **COD Policy** | *"Do you accept Cash on Delivery?"* | Confirms COD up to ₹2,500 with cash or UPI at doorstep. |
| **Out-of-Scope** | *"Can you book me a flight to Goa?"* | Politely declines, stating Aria can only assist with Aura Skincare queries. |
| **Mumbled / Invalid Order** | *"Where is order ORD-999?"* | Gracefully informs the customer the ID was not found and requests verification without hallucinating. |

---

## 💡 Section 9: Tell Us How You Think

### 1. Why did you choose your particular architecture and technology stack?
I chose a **100% Python backend (FastAPI) paired with a zero-build client-side interface**, developed using **Google's Antigravity IDE** paired with **Google Gemini** (in direct alignment with Section 6's encouragement of modern AI tooling):
- **Maximum Reliability & Zero-Friction Evaluation**: Heavy JavaScript frontends (Next.js, React) introduce build step complexity, hydration overhead, and node version incompatibilities. A clean FastAPI architecture serves the complete application as a self-contained unit, starting up in milliseconds and deploying effortlessly on Render or Railway.
- **Natural Indian Voice Quality**: Many voice demos use generic American or robotic browser voices. By leveraging Python's `edge-tts` with high-fidelity expressive neural models (`en-IN-NeerjaExpressiveNeural`), Aria sounds like a genuine Indian customer support specialist with warm, human cadence at zero API cost.
- **Dual-Engine Resiliency**: The reasoning layer uses Gemini function calling for flexible natural language comprehension, backed by a deterministic guardrail engine. If an API key expires or network lag spikes, the agent seamlessly degrades rather than crashing or freezing.
- **AI-Assisted Development (Section 6)**: Developed and profiled using **Google's Antigravity IDE**, enabling rapid prototyping and rigorous acoustic/guardrail testing while maintaining strict first-principles ownership of the codebase.

### 2. What was the most difficult part of the assignment, and how did you solve it?
The most challenging aspect was **achieving low-latency conversational turn-taking and natural speech formatting**:
- *The Problem*: In conversational voice interfaces, awkward silences break immersion. Furthermore, LLMs love generating markdown (`*bold*`, `- bullet points`), currency symbols (`₹699`), and acronyms (`ORD-101`) that sound unintelligible when read raw by a speech synthesizer ("asterisk rupee 699").
- *The Solution*: 
  1. Built an audio text normalizer in `app/tts.py` that strips markdown, expands currency symbols (`"Rupees 699"`), and spaces out order IDs (`"O-R-D 1 0 1"`) for crisp audio clarity.
  2. Implemented a 4-state visual machine (`Idle` $\rightarrow$ `Listening` $\rightarrow$ `Thinking` $\rightarrow$ `Speaking`) with client-side audio queuing and synchronized microphone turn-taking to prevent speaker feedback.

### 3. If you had one more week to work on this, what would you improve first and why?
1. **Full-Duplex WebRTC Streaming (Multimodal Live API)**: Replace the REST turn-based audio pipeline with a persistent WebRTC connection (e.g., Gemini Live API or LiveKit + Deepgram). This would reduce turnaround latency from ~1.2s to sub-500ms and enable natural mid-sentence barge-in.
2. **Hinglish & Multilingual Code-Switching**: Indian D2C shoppers frequently code-switch (e.g., *"Bhai mera ORD-101 kab tak aayega?"*). Fine-tuning an STT/TTS pipeline for Hindi-English code-mixing would provide a superior local customer experience.
3. **Database & CRM Persistence**: Replace the in-memory mock dictionary with Supabase/PostgreSQL, tracking ticket resolution history, customer sentiment trends, and automated WhatsApp notification triggers.

### 4. Imagine this agent is handling 1,000 customer conversations a day. What do you think would need to change or improve?
1. **Distributed State & Scalability**:
   - Transition from in-memory session tracking to **Redis** for distributed session management and pub/sub audio event handling across clustered FastAPI worker nodes.
   - Run behind an NGINX reverse proxy with Cloudflare DDoS protection and load balancing.
2. **Edge Caching for FAQs**:
   - Cache frequently asked policy queries (shipping thresholds, return rules, COD limits) using semantic vector caching (e.g., Redis Semantic Cache). This would bypass LLM calls for ~40% of queries, saving token costs and reducing latency to <100ms.
3. **Telephony & SIP Gateway Integration**:
   - Integrate with Twilio, Exotel, or Plivo via SIP trunking so customers can dial a standard 1-800 phone number and reach Aria directly.
4. **Observability, Guardrails & Human Handoff**:
   - Integrate telemetry tools (OpenTelemetry / Langfuse) to track First Token Latency (TTFT), tool call accuracy, and policy compliance rates.
   - Implement an automated sentiment analysis trigger that escalates the call to a human agent if customer frustration or unresolved intent exceeds a threshold.
