# 🌿 Aura Skincare — AI Voice Customer Support Agent (Aria)
## Datastraw Technologies Intern Assessment Submission

---

### 1. 🌐 Public Application URL
- **Live HTTPS URL (Active with Mic Access)**:
  `https://ports-foot-williams-continually.trycloudflare.com`
- **Fallback / Cloud Deployment**:
  Configured for 1-click deploy on Render via included `render.yaml` and `Dockerfile`.

> *Note for Evaluators: Please open in Google Chrome or Microsoft Edge and click "Allow" when prompted for microphone access.*

---

### 2. 💻 GitHub Repository
- **Repository URL**: `https://github.com/Aditya-200308/aura-voice-agent`
- **Branch**: `main`
- **Included Deliverables**:
  - `README.md` (comprehensive architecture diagram, Section 9 in-depth answers, testing matrix, quickstart guide)
  - `.env.example` (environment configuration template)
  - Complete source code (`app/` backend, `static/` modern frontend, zero-build setup)
  - `render.yaml`, `Dockerfile`, `Procfile` (production-ready deployment configs)

---

### 3. 🎬 3–5 Minute Demo Video
- **Video Link**: `[Insert Loom / YouTube / Google Drive link here]`
- **Video Script & Checklist**: Refer to `demo_video_script.md` in the project documentation.
- **Demonstration Highlights**:
  - Real-time spoken order tracking for `ORD-101` (BlueDart ETA).
  - Cancellation policy enforcement: rejection for in-transit `ORD-101` vs. success for processing `ORD-103`.
  - Brand guardrail checks: ₹2,500 Cash on Delivery ceiling and 7-day return policy.
  - End-of-call structured JSON outcome extraction and full chronological transcript modal.

---

### 4. 📝 Short Approach Note (2–3 Sentences)
> *"I designed Aura Skincare's AI Voice Agent ('Aria') using a unified Python FastAPI backend and a zero-build client-side interface, combining high-fidelity Microsoft neural Indian English voice synthesis with structured Gemini function calling. The architecture pairs dynamic tool execution (order tracking, cancellations, pincode serviceability, product recommendations) with a deterministic guardrail engine that strictly enforces D2C policies (such as a ₹2,500 COD limit and 7-day unopened returns). To ensure a smooth customer experience, the system coordinates turn-based microphone isolation to eliminate speaker echo, followed by automated post-call structured JSON telemetry."*

---

### 5. 🔗 LinkedIn Profile
- **Candidate Name**: Aditya Suvarna
- **LinkedIn Profile**: `https://www.linkedin.com/in/aditya-suvarna-b19282294/`
