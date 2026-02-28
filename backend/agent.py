# backend/agent.py
import os
import time
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/agent", tags=["agent"])

# ---- ENV VARS YOU MUST SET ----
# ORCH_API_KEY=...
# ORCH_INSTANCE_URL=https://dl.watson-orchestrate.ibm.com (or your instance url)
# ORCH_AGENT_ENV_ID=a0f497c7-c69b-4715-9e6e-8b827ae2125d

ORCH_API_KEY = os.environ.get("ORCH_API_KEY", "").strip()
ORCH_INSTANCE_URL = os.environ.get("ORCH_INSTANCE_URL", "https://dl.watson-orchestrate.ibm.com").strip()
ORCH_AGENT_ENV_ID = os.environ.get("ORCH_AGENT_ENV_ID", "").strip()

IAM_TOKEN_URL = "https://iam.cloud.ibm.com/identity/token"

# Simple in-memory token cache
_token_cache = {"token": None, "exp": 0}


def _get_iam_token() -> str:
    if not ORCH_API_KEY:
        raise HTTPException(status_code=500, detail="Missing ORCH_API_KEY env var")

    now = int(time.time())
    # refresh ~2 minutes before expiry
    if _token_cache["token"] and now < (_token_cache["exp"] - 120):
        return _token_cache["token"]

    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
        "apikey": ORCH_API_KEY,
    }

    r = requests.post(IAM_TOKEN_URL, headers=headers, data=data, timeout=20)
    if not r.ok:
        raise HTTPException(status_code=500, detail=f"IAM token request failed: {r.status_code} {r.text}")

    payload = r.json()
    access_token = payload.get("access_token")
    expires_in = int(payload.get("expires_in", 3600))

    if not access_token:
        raise HTTPException(status_code=500, detail="IAM token response missing access_token")

    _token_cache["token"] = access_token
    _token_cache["exp"] = now + expires_in
    return access_token


class ChatRequest(BaseModel):
    text: str


@router.post("/chat")
def chat(req: ChatRequest):
    """
    Sends a user message to watsonx Orchestrate agent runtime and returns a single text reply.
    """
    if not ORCH_AGENT_ENV_ID:
        raise HTTPException(status_code=500, detail="Missing ORCH_AGENT_ENV_ID env var")

    token = _get_iam_token()

    # NOTE: This endpoint matches the assistant runtime style you previously used.
    # If IBM changes the exact route, we can adjust, but this is the common pattern.
    url = f"{ORCH_INSTANCE_URL}/instances/api/v2/assistants/{ORCH_AGENT_ENV_ID}/message?version=2021-06-14"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    body = {
        "input": {
            "message_type": "text",
            "text": req.text
        }
    }

    r = requests.post(url, headers=headers, json=body, timeout=30)

    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    data = r.json()

    # Best-effort extraction (same as your frontend did)
    reply = (
        data.get("output", {})
            .get("generic", [{}])[0]
            .get("text")
    ) or "I processed your request, but didn't receive a text response."

    return {"reply": reply}