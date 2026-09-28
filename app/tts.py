"""
Text-to-Speech (TTS) module for Aria's Voice.
Uses Microsoft's neural Indian voice via edge-tts.
"""

from typing import Optional
import io
import re
import logging
import edge_tts

logger = logging.getLogger("aura-tts")

# Aria's dedicated Indian English neural voice (Microsoft Expressive Conversational Neural)
ARIA_INDIAN_VOICE = "en-IN-NeerjaExpressiveNeural"

# Ensure edge-tts generates valid en-IN SSML instead of default hardcoded en-US
import edge_tts.communicate as ec
_orig_mkssml = ec.mkssml

def _natural_indian_mkssml(tc, escaped_text):
    if isinstance(escaped_text, bytes):
        escaped_text = escaped_text.decode("utf-8")
    lang = "en-IN" if "IN" in tc.voice else "en-US"
    return (
        f"<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='{lang}'>"
        f"<voice name='{tc.voice}'>"
        f"<prosody pitch='{tc.pitch}' rate='{tc.rate}' volume='{tc.volume}'>"
        f"{escaped_text}"
        "</prosody>"
        "</voice>"
        "</speak>"
    )

ec.mkssml = _natural_indian_mkssml


# Global In-Memory Audio Cache to eliminate TTS synthesis latency
AUDIO_CACHE = {}


def clean_text_for_speech(text: str) -> str:
    """
    Pre-processes text to ensure fluent, natural Indian English enunciation
    without awkward pauses, robotic spelling, or stuttering.
    """
    if not text:
        return ""
    # Strip parentheses and brackets but retain inner text
    cleaned = re.sub(r'[\(\)\[\]\{\}]', '', text)
    # Strip markdown symbols (*, _, #, `, ~, >)
    cleaned = re.sub(r'[*_#`~>]', '', cleaned)
    # Convert ₹ to Rupees
    cleaned = re.sub(r'₹\s*(\d+)', r'\1 rupees', cleaned)
    cleaned = cleaned.replace("₹", "rupees ")
    # Replace order IDs with fluent phrasing: 'ORD-101' -> 'order 101'
    cleaned = re.sub(r'\border\s+ORD[- ]*(\d{3})\b', r'order \1', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bORD[- ]*(\d{3})\b', r'order \1', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\border\s+order\s+(\d{3})\b', r'order \1', cleaned, flags=re.IGNORECASE)
    # Remove tracking dashes or courier code fragments that cause long pauses
    cleaned = re.sub(r'—\s*[A-Z0-9-]+\.?', '', cleaned)
    cleaned = re.sub(r'-\s*[A-Z0-9-]+\.?', '', cleaned)
    cleaned = cleaned.replace(" — ", " ")
    cleaned = cleaned.replace(" - ", " ")
    # Expand brands / terms for crystal-clear enunciation
    cleaned = re.sub(r'\bBlueDart\b', 'Blue Dart', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bDelhivery\b', 'Delhivery', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bUPI\b', 'U P I', cleaned)
    cleaned = re.sub(r'\bCOD\b', 'Cash on Delivery', cleaned)
    cleaned = re.sub(r'(\d+)\s*ml\b', r'\1 ml', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bSPF\s*50\b', 'SPF fifty', cleaned, flags=re.IGNORECASE)
    
    # ELIMINATE AWKWARD LONG PAUSES:
    # 1. Soften exclamation marks into gentle comma pauses so they don't produce a 500ms dead stop
    cleaned = re.sub(r'!\s*', ', ', cleaned)
    # 2. Remove commas before conjunctions that cause unnatural mid-sentence hesitation
    cleaned = re.sub(r',\s*(because|but|and|or|while|though|so)\b', r' \1', cleaned, flags=re.IGNORECASE)
    # 3. Soften apology phrasing
    cleaned = re.sub(r'\bI\'m sorry,\s*', "I'm sorry ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bI am sorry,\s*', "I am sorry ", cleaned, flags=re.IGNORECASE)
    # 4. Clean up duplicate punctuation and periods
    cleaned = re.sub(r'[,;]\s*[,;]+', ',', cleaned)
    cleaned = re.sub(r'\.+', '.', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


async def synthesize_speech_bytes(text: str, voice: Optional[str] = None) -> bytes:
    """
    Synthesizes speech using Aria's dedicated Indian English neural voice.
    Uses in-memory cache for instant 0ms responses on repeated/common phrases.
    Paced at +4% for a warm, natural, human conversational customer specialist delivery.
    """
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return b""
        
    chosen_voice = voice if voice and "IN" in voice else ARIA_INDIAN_VOICE
    cache_key = f"{chosen_voice}:{clean_text}"
    
    if cache_key in AUDIO_CACHE:
        return AUDIO_CACHE[cache_key]
        
    try:
        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=chosen_voice,
            rate="+4%",
            pitch="+0Hz"
        )
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        audio_bytes = audio_stream.getvalue()
        if audio_bytes:
            AUDIO_CACHE[cache_key] = audio_bytes
        return audio_bytes
    except Exception as e:
        logger.error(f"Error synthesizing speech with edge-tts: {e}")
        raise e


async def prewarm_tts_cache():
    """Pre-generates audio for standard phrases so users experience instantaneous voice playback."""
    phrases = [
        "Hello and welcome to Aura Skincare, my name is Aria. How may I assist you with your orders or products today?",
        "Order 101 for Priya Sharma containing Vitamin C Serum 30ml is out for delivery via Blue Dart and is expected by 6 PM today.",
        "Order 102 for Rahul Verma containing Hydrating Sunscreen SPF fifty was delivered 14 days ago via Delhivery.",
        "Order 103 for Ananya Patel is currently processing and being packed. It was placed recently and is eligible for cancellation if needed.",
        "Order ORD-103 for Ananya Patel is currently processing and being packed. It was placed recently and is eligible for cancellation if needed. Meanwhile, order ORD-102 for Rahul Verma containing Hydrating Sunscreen SPF fifty was delivered 14 days ago via Delhivery.",
        "I am sorry but order 101 cannot be cancelled because it is already Out for Delivery. Per our policy, cancellations are only possible while processing, so you may refuse delivery at your doorstep when it arrives.",
        "I am sorry but order ORD-101 cannot be cancelled because it is already Out for Delivery. Per our policy, cancellations are only possible while processing, so you may refuse delivery at your doorstep when it arrives.",
        "As mentioned earlier, order 101 is already Out for Delivery and cannot be cancelled in our system. You can simply decline delivery when the courier arrives.",
        "As mentioned earlier, order ORD-101 is already Out for Delivery and cannot be cancelled in our system. You can simply decline delivery when the courier arrives.",
        "Your order ORD-103 has been successfully cancelled as it was still in processing. A confirmation has been sent to your registered contact.",
        "Your order 103 has been successfully cancelled as it was still in processing. A confirmation has been sent to your registered contact.",
        "We offer free delivery on all orders above 499 rupees. For orders below 499 rupees, a standard shipping fee of 50 rupees applies. Delivery usually takes 3 to 5 business days.",
        "Yes, Cash on Delivery is available for orders up to 2500 rupees. You can conveniently pay either in cash or via UPI at your doorstep.",
        "I can only assist with Aura Skincare orders, products, and policies. Is there anything regarding your order or our skincare range I can help with?",
        "I am sorry but our return policy only accepts unopened products in original packaging within 7 days of delivery. Because the product has been opened or exceeds 7 days, we are unable to process a return."
    ]
    for p in phrases:
        try:
            await synthesize_speech_bytes(p)
        except Exception as e:
            logger.warning(f"Cache pre-warm error for '{p[:30]}': {e}")
    logger.info(f"TTS audio cache pre-warmed with {len(AUDIO_CACHE)} standard responses.")

