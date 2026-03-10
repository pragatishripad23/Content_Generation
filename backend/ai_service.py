import os
import asyncio
import base64
import uuid
import logging
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

logger = logging.getLogger(__name__)
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
FAL_KEY = os.environ.get("FAL_KEY")


async def generate_text_claude(brief: str, platform: str, tone: str, brand_voice: str = None) -> dict:
    try:
        system_msg = f"""You are an expert social media copywriter. Generate a compelling {platform} post.
Tone: {tone}. {"Brand voice: " + brand_voice if brand_voice else ""}
Return ONLY a JSON object with keys: caption, hashtags (list), score (0-100 engagement potential)."""
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"Create a {platform} post about: {brief}")
        response = await chat.send_message(msg)
        import json
        try:
            cleaned = response.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0]
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0]
            data = json.loads(cleaned)
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
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("openai", "gpt-4o")
        msg = UserMessage(text=f"Create a {platform} post about: {brief}")
        response = await chat.send_message(msg)
        import json
        try:
            cleaned = response.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0]
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0]
            data = json.loads(cleaned)
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
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("gemini", "gemini-2.5-flash")
        msg = UserMessage(text=f"Create a {platform} post about: {brief}")
        response = await chat.send_message(msg)
        import json
        try:
            cleaned = response.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0]
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0]
            data = json.loads(cleaned)
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
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"Original caption: {caption}")
        response = await chat.send_message(msg)
        import json
        cleaned = response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Variation error: {e}")
        return [{"variation_type": "Original", "caption": caption, "hashtags": []}]


async def generate_image(prompt: str, brand_colors: list = None) -> dict:
    try:
        color_context = f" Use brand colors: {', '.join(brand_colors)}." if brand_colors else ""
        system_msg = "You are an AI image generator for social media marketing. Create visually striking images."
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        msg = UserMessage(text=f"Generate a social media post image: {prompt}{color_context}")
        text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            img_data = images[0]["data"]
            mime = images[0].get("mime_type", "image/png")
            data_url = f"data:{mime};base64,{img_data}"
            return {"success": True, "image_url": data_url, "text": text, "model": "nano-banana"}
        return {"success": False, "error": "No image generated", "model": "nano-banana"}
    except Exception as e:
        logger.error(f"Image gen error: {e}")
        return {"success": False, "error": str(e), "model": "nano-banana"}


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
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        msg = UserMessage(text=f"Topic: {topic}\nObjective: {objective}\nAudience: {audience}\nDuration: {duration_days} days\n{'Brand voice: ' + brand_voice if brand_voice else ''}")
        response = await chat.send_message(msg)
        import json
        cleaned = response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Ideation error: {e}")
        return {"concepts": [], "calendar_outline": [], "error": str(e)}


async def analyze_performance(metrics_json: dict, period: str = "7d") -> dict:
    try:
        system_msg = """You are a social media analytics expert. Analyze the performance data.
Return a JSON object with keys: insights (list of strings), patterns (list), anomalies (list), recommendations (list)."""
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        import json
        msg = UserMessage(text=f"Period: {period}\nMetrics: {json.dumps(metrics_json)}")
        response = await chat.send_message(msg)
        cleaned = response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return {"insights": [], "patterns": [], "anomalies": [], "recommendations": [], "error": str(e)}


async def generate_weekly_report(week_data: dict) -> dict:
    try:
        system_msg = """You are a social media performance analyst. Generate a comprehensive weekly report.
Return a JSON object with: summary (string), highlights (list), top_posts (list of descriptions), underperformers (list), growth_metrics (object), sentiment_overview (string), competitor_snapshot (string), recommendations (list), next_week_plan (list)."""
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        import json
        msg = UserMessage(text=f"Week data:\n{json.dumps(week_data)}")
        response = await chat.send_message(msg)
        cleaned = response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Report error: {e}")
        return {"summary": "Error generating report", "error": str(e)}


async def classify_sentiment(comments: list) -> list:
    try:
        system_msg = """You are a sentiment analysis expert. Classify each comment.
Return a JSON array of objects with keys: text, sentiment (positive/negative/neutral), score (0-100)."""
        chat = LlmChat(api_key=EMERGENT_KEY, session_id=str(uuid.uuid4()), system_message=system_msg)
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")
        import json
        msg = UserMessage(text=f"Classify these comments:\n{json.dumps(comments)}")
        response = await chat.send_message(msg)
        cleaned = response.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0]
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        return [{"text": c, "sentiment": "neutral", "score": 50} for c in comments]
