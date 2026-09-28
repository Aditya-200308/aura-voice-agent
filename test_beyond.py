import urllib.request
import json

def test_query(msg, sid="test_beyond_session"):
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/chat",
        data=json.dumps({"session_id": sid, "message": msg}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

queries = [
    ("Hinglish Tracking", "Mera order ORD-101 kahan hai?"),
    ("Hinglish Cancellation", "Kya mera order ORD-103 cancel ho sakta hai?"),
    ("Hinglish Pincode", "Pincode 560001 pe delivery milegi kya?"),
    ("Hinglish Recs", "Oily skin ke liye koi accha serum suggest karo"),
    ("Ambiguous No-ID", "Where is my order?"),
    ("Ambiguous Cancel No-ID", "Can you cancel my order please?"),
    ("Unknown ID ORD-999", "Please check order ORD-999"),
    ("Multi-Brand Aura Derma", "Tell me about Aura Derma"),
    ("Multi-Brand Aura Men", "What products does Aura Men have?"),
]

print("=== RUNNING BEYOND THE BASICS TEST SUITE ===\n")
for label, q in queries:
    res = test_query(q, sid=f"session_{label.replace(' ', '_')}")
    print(f"[{label}]")
    print(f"Customer: {q}")
    print(f"Tool Used: {res.get('tool_used')}")
    print(f"Aria: {res.get('response_text')}")
    print("-" * 60)
