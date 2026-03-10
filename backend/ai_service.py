import os
import asyncio
import base64
import uuid
import json
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# API Keys
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
FAL_KEY = os.environ.get("FAL_KEY")


async def _call_anthropic(system_msg: str, user_msg: str) -> str:
    """Call Claude API directly via httpx"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 4096,
                "system": system_msg,
                "messages": [{"role": "user", "content": user_msg}],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["content"][0]["text"]


async def _call_openai(system_msg: str, user_msg: str) -> str:
    """Call OpenAI API directly via httpx"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_gemini(system_msg: str, user_msg: str) -> str:
    """Call Gemini API directly via httpx"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "systemInstruction": {"parts": [{"text": system_msg}]},
                "contents": [{"parts": [{"text": user_msg}]}],
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


def _parse_json_response(response: str) -> dict:
    """Parse JSON from LLM response, handling code blocks"""
    cleaned = response.strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0]
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0]
    return json.loads(cleaned)


async def generate_text_claude(brief: str, platform: str, tone: str, brand_voice: str = None) -> dict:
    try:
        system_msg = f"""You are an expert social media copywriter. Generate a compelling {platform} post.
Tone: {tone}. {"Brand voice: " + brand_voice if brand_voice else ""}
Return ONLY a JSON object with keys: caption, hashtags (list), score (0-100 engagement potential)."""
        user_msg = f"Create a {platform} post about: {brief}"
        response = await _call_anthropic(system_msg, user_msg)
        try:
            data = _parse_json_response(response)
            return {"model": "claude-sonnet", "caption": data.get("caption", response), "hashtags": data.get("hashtags", []), "score": data.get("score", 75)}
        except json.JSONDecodeError:
            return {"model": "claude-sonnet", "caption": response, "hashtags": [], "score": 75}
    except Exception as e:
        logger.error(f"Claude error: {e}")
        return {"model": "claude-sonnet", "caption": f"[Claude] Error: {str(e)}", "hashtags": [], "score": 0, "error": True}


async def generate_text_gpt4o(brief: str, platform: str, tone: str, brand_voice: str = None) -> dict:
    try:
        system_msg = f"""You are an expert social media copywriter. Generate a compelling {platform} post.
Tone: {tone}. {"Brand voice: " + brand_voice if brand_voice else ""}
Return ONLY a JSON object with keys: caption, hashtags (list), score (0-100 engagement potential)."""
        user_msg = f"Create a {platform} post about: {brief}"
        response = await _call_openai(system_msg, user_msg)
        try:
            data = _parse_json_response(response)
            return {"model": "gpt-4o", "caption": data.get("caption", response), "hashtags": data.get("hashtags", []), "score": data.get("score", 78)}
        except json.JSONDecodeError:
            return {"model": "gpt-4o", "caption": response, "hashtags": [], "score": 78}
    except Exception as e:
        logger.error(f"GPT-4o error: {e}")
        return {"model": "gpt-4o", "caption": f"[GPT-4o] Error: {str(e)}", "hashtags": [], "score": 0, "error": True}


async def generate_text_gemini(brief: str, platform: str, tone: str, brand_voice: str = None) -> dict:
    try:
        system_msg = f"""You are an expert social media copywriter. Generate a compelling {platform} post.
Tone: {tone}. {"Brand voice: " + brand_voice if brand_voice else ""}
Return ONLY a JSON object with keys: caption, hashtags (list), score (0-100 engagement potential)."""
        user_msg = f"Create a {platform} post about: {brief}"
        response = await _call_gemini(system_msg, user_msg)
        try:
            data = _parse_json_response(response)
            return {"model": "gemini", "caption": data.get("caption", response), "hashtags": data.get("hashtags", []), "score": data.get("score", 72)}
        except json.JSONDecodeError:
            return {"model": "gemini", "caption": response, "hashtags": [], "score": 72}
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return {"model": "gemini", "caption": f"[Gemini] Error: {str(e)}", "hashtags": [], "score": 0, "error": True}


async def generate_text_all_models(brief: str, platform: str, tone: str, brand_voice: str = None) -> list:
    results = await asyncio.gather(
        generate_text_claude(brief, platform, tone, brand_voice),
        generate_text_gpt4o(brief, platform, tone, brand_voice),
        generate_text_gemini(brief, platform, tone, brand_voice),
        return_exceptions=True,
    )
    output = []
    for r in results:
        if isinstance(r, Exception):
            output.append({"model": "unknown", "caption": str(r), "hashtags": [], "score": 0, "error": True})
        else:
            output.append(r)
    return output


async def generate_caption_variations(caption: str, count: int = 5) -> list:
    try:
        system_msg = f"""Generate exactly {count} style variations of the given social media caption.
Return a JSON array of objects, each with keys: variation_type (Short/Long/Question/Story/CTA-heavy/Humour), caption, hashtags (list).
Only return the JSON array, nothing else."""
        user_msg = f"Original caption: {caption}"
        response = await _call_anthropic(system_msg, user_msg)
        return _parse_json_response(response)
    except Exception as e:
        logger.error(f"Variation error: {e}")
        return [{"variation_type": "Original", "caption": caption, "hashtags": []}]


async def generate_image(prompt: str, brand_colors: list = None) -> dict:
    """Generate image using Google Gemini Imagen API"""
    try:
        color_context = f" Use brand colors: {', '.join(brand_colors)}." if brand_colors else ""
        full_prompt = f"Generate a social media post image: {prompt}{color_context}"
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GOOGLE_API_KEY}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
                },
            )
            response.raise_for_status()
            data = response.json()
            
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text_content = ""
            image_data = None
            
            for part in parts:
                if "text" in part:
                    text_content = part["text"]
                if "inlineData" in part:
                    image_data = part["inlineData"]
            
            if image_data:
                mime = image_data.get("mimeType", "image/png")
                img_b64 = image_data.get("data", "")
                data_url = f"data:{mime};base64,{img_b64}"
                return {"success": True, "image_url": data_url, "text": text_content, "model": "gemini-imagen"}
            
            return {"success": False, "error": "No image generated", "model": "gemini-imagen"}
    except Exception as e:
        logger.error(f"Image gen error: {e}")
        return {"success": False, "error": str(e), "model": "gemini-imagen"}


async def generate_video(prompt: str, duration: str = "8s", aspect_ratio: str = "16:9") -> dict:
    try:
        import fal_client
        fal_client.api_key = FAL_KEY
        result = fal_client.subscribe(
            "fal-ai/veo3",
            arguments={
                "prompt": prompt,
                "duration": duration,
                "aspect_ratio": aspect_ratio,
                "generate_audio": True,
                "enhance_prompt": True,
            },
            with_logs=True,
        )
        video_url = result.get("video", {}).get("url", "")
        return {"success": True, "video_url": video_url, "model": "veo3", "duration": duration}
    except Exception as e:
        logger.error(f"Video gen error: {e}")
        return {"success": False, "error": str(e), "model": "veo3"}


async def submit_video_async(prompt: str, duration: str = "8s", aspect_ratio: str = "16:9") -> dict:
    try:
        import fal_client
        fal_client.api_key = FAL_KEY
        result = fal_client.queue.submit(
            "fal-ai/veo3",
            input={
                "prompt": prompt,
                "duration": duration,
                "aspect_ratio": aspect_ratio,
                "generate_audio": True,
                "enhance_prompt": True,
            },
        )
        return {"success": True, "request_id": result.get("request_id"), "status": "queued"}
    except Exception as e:
        logger.error(f"Video submit error: {e}")
        return {"success": False, "error": str(e)}


async def check_video_status(request_id: str) -> dict:
    try:
        import fal_client
        fal_client.api_key = FAL_KEY
        status = fal_client.queue.status("fal-ai/veo3", request_id=request_id, logs=True)
        return {"success": True, "request_id": request_id, "status": status}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def get_video_result(request_id: str) -> dict:
    try:
        import fal_client
        fal_client.api_key = FAL_KEY
        result = fal_client.queue.result("fal-ai/veo3", request_id=request_id)
        video_url = result.get("video", {}).get("url", "")
        return {"success": True, "video_url": video_url}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def ideate_campaign(topic: str, objective: str, audience: str, duration_days: int, brand_voice: str = None) -> dict:
    try:
        system_msg = """You are a senior social media strategist. Generate campaign concepts.
Return a JSON object with keys:
- concepts: array of 3-5 objects each with: name, angle, tagline, content_pillars (list), post_types (list)
- calendar_outline: array of objects with: day (number), post_type, topic, platform"""
        user_msg = f"Topic: {topic}\nObjective: {objective}\nAudience: {audience}\nDuration: {duration_days} days\n{'Brand voice: ' + brand_voice if brand_voice else ''}"
        response = await _call_anthropic(system_msg, user_msg)
        return _parse_json_response(response)
    except Exception as e:
        logger.error(f"Ideation error: {e}")
        return {"concepts": [], "calendar_outline": [], "error": str(e)}


async def analyze_performance(metrics_json: dict, period: str = "7d") -> dict:
    try:
        system_msg = """You are a social media analytics expert. Analyze the performance data.
Return a JSON object with keys: insights (list of strings), patterns (list), anomalies (list), recommendations (list)."""
        user_msg = f"Period: {period}\nMetrics: {json.dumps(metrics_json)}"
        response = await _call_anthropic(system_msg, user_msg)
        return _parse_json_response(response)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return {"insights": [], "patterns": [], "anomalies": [], "recommendations": [], "error": str(e)}


async def generate_weekly_report(week_data: dict) -> dict:
    try:
        system_msg = """You are a social media performance analyst. Generate a comprehensive weekly report.
Return a JSON object with: summary (string), highlights (list), top_posts (list of descriptions), underperformers (list), growth_metrics (object), sentiment_overview (string), competitor_snapshot (string), recommendations (list), next_week_plan (list)."""
        user_msg = f"Week data:\n{json.dumps(week_data)}"
        response = await _call_anthropic(system_msg, user_msg)
        return _parse_json_response(response)
    except Exception as e:
        logger.error(f"Report error: {e}")
        return {"summary": "Error generating report", "error": str(e)}


async def classify_sentiment(comments: list) -> list:
    try:
        system_msg = """You are a sentiment analysis expert. Classify each comment.
Return a JSON array of objects with keys: text, sentiment (positive/negative/neutral), score (0-100)."""
        user_msg = f"Classify these comments:\n{json.dumps(comments)}"
        response = await _call_anthropic(system_msg, user_msg)
        return _parse_json_response(response)
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        return [{"text": c, "sentiment": "neutral", "score": 50} for c in comments]
