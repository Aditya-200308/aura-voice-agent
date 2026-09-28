"""
FastAPI application entrypoint for Aura Voice Agent.
Serves static frontend and API endpoints for chat, TTS, orders, and post-call analytics.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure UTF-8 stdout/stderr on Windows console to prevent UnicodeEncodeError on ₹ (rupee) or other unicode symbols
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Load environment variables
load_dotenv()

import asyncio
from app.database import get_all_orders_summary
from app.agent import process_user_turn, generate_post_call_summary, get_or_create_session
from app.tts import synthesize_speech_bytes, prewarm_tts_cache

app = FastAPI(
    title="Aura Skincare AI Voice CX Agent",
    description="Browser-based Voice Agent with Indian Voice (Aria), Gemini function calling, and strict D2C guardrails.",
    version="1.0.0"
)

@app.on_event("startup")
async def on_startup():
    # Pre-generate common responses in background for instantaneous voice playback
    asyncio.create_task(prewarm_tts_cache())

# Enable CORS for broad compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files directory
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


# Request / Response Schemas
class ChatRequest(BaseModel):
    session_id: str
    message: str


class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None


class EndCallRequest(BaseModel):
    session_id: str


class ResetCallRequest(BaseModel):
    session_id: str


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "Aria (Aura Skincare)",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here")
    }


@app.get("/api/orders")
async def get_mock_orders():
    """Returns sample orders for the evaluator quick-test card."""
    return {"orders": get_all_orders_summary()}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Processes customer utterance, executes tools, and returns Aria's response."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    try:
        print(f"\n>>> [CHAT RECEIVED] session={req.session_id} message={req.message!r}")
    except Exception:
        pass

    result = await process_user_turn(req.session_id, req.message)

    try:
        reply_preview = result.get('response_text', '')
        print(f"<<< [AGENT REPLY] response={reply_preview!r}\n")
    except Exception:
        pass

    return result


@app.post("/api/tts")
async def tts_endpoint(req: TTSRequest):
    """Synthesizes text using Aria's natural neural voice."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    try:
        audio_bytes = await synthesize_speech_bytes(req.text, voice=req.voice)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")


@app.post("/api/reset-call")
async def reset_call_endpoint(req: ResetCallRequest):
    """Resets the live conversation context while preserving pre-reset logs for post-call JSON summary."""
    session = get_or_create_session(req.session_id)
    session.record_reset()
    return {
        "status": "reset_successful",
        "session_id": req.session_id,
        "reset_count": session.reset_count,
        "total_messages_preserved": len(session.messages)
    }


@app.post("/api/end-call")
async def end_call_endpoint(req: EndCallRequest):
    """Concludes the call session, returns chronological transcript, and structured JSON summary."""
    session = get_or_create_session(req.session_id)
    summary = await generate_post_call_summary(req.session_id)
    return {
        "session_id": req.session_id,
        "transcript": session.get_transcript(),
        "summary": summary
    }


# Mount static assets and root route
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(STATIC_DIR / "index.html"))
