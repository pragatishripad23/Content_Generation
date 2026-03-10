from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from auth import hash_password, verify_password, create_token, get_current_user
from models import (
    RegisterRequest, LoginRequest, AuthResponse,
    BrandProfileCreate, BrandProfile,
    SocialAccountCreate, SocialAccount,
    CampaignCreate, Campaign,
    PostCreate, Post, PostVariation, CaptionVariation,
    ScheduleCreate, Schedule,
    TextGenerationRequest, ImageGenerationRequest, VideoGenerationRequest,
    CampaignIdeationRequest,
    CompetitorCreate, Competitor,
    TeamMemberCreate, TeamMember,
    Alert, BoostSuggestion, WeeklyReport,
    new_id, utc_now,
)
import ai_service
import mock_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="SolisBoard API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Auth ───
@api.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = new_id()
    user_doc = {
        "id": user_id, "email": req.email, "name": req.name,
        "password_hash": hash_password(req.password),
        "company": req.company, "industry": req.industry,
        "plan_tier": "free", "created_at": utc_now().isoformat(),
    }
    await db.users.insert_one(user_doc)
    brand_id = new_id()
    await db.brands.insert_one({
        "id": brand_id, "user_id": user_id, "name": req.company or req.name,
        "voice": "professional", "colors": [], "fonts": [], "logo_url": None,
        "industry": req.industry, "keywords": [], "created_at": utc_now().isoformat(),
    })
    token = create_token(user_id, req.email)
    return {"token": token, "user": {"id": user_id, "email": req.email, "name": req.name, "brand_id": brand_id}}

@api.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    brand = await db.brands.find_one({"user_id": user["id"]}, {"_id": 0})
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "brand_id": brand["id"] if brand else None}}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    u = await db.users.find_one({"id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user": u, "brand": brand}

# ─── Brands ───
@api.get("/brands")
async def get_brands(user=Depends(get_current_user)):
    brands = await db.brands.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50)
    return brands

@api.put("/brands/{brand_id}")
async def update_brand(brand_id: str, data: BrandProfileCreate, user=Depends(get_current_user)):
    await db.brands.update_one({"id": brand_id, "user_id": user["user_id"]}, {"$set": data.model_dump()})
    updated = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    return updated

# ─── Social Accounts ───
@api.get("/brands/{brand_id}/social-accounts")
async def get_social_accounts(brand_id: str, user=Depends(get_current_user)):
    accounts = await db.social_accounts.find({"brand_id": brand_id}, {"_id": 0}).to_list(20)
    return accounts

@api.post("/brands/{brand_id}/social-accounts")
async def add_social_account(brand_id: str, data: SocialAccountCreate, user=Depends(get_current_user)):
    account = SocialAccount(brand_id=brand_id, **data.model_dump())
    doc = account.model_dump()
    await db.social_accounts.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.delete("/brands/{brand_id}/social-accounts/{account_id}")
async def remove_social_account(brand_id: str, account_id: str, user=Depends(get_current_user)):
    await db.social_accounts.delete_one({"id": account_id, "brand_id": brand_id})
    return {"deleted": True}

# ─── Campaigns ───
@api.get("/campaigns")
async def get_campaigns(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if brand_id:
        query["brand_id"] = brand_id
    else:
        brands = await db.brands.find({"user_id": user["user_id"]}, {"id": 1, "_id": 0}).to_list(50)
        brand_ids = [b["id"] for b in brands]
        query["brand_id"] = {"$in": brand_ids}
    campaigns = await db.campaigns.find(query, {"_id": 0}).to_list(100)
    if campaigns:
        campaign_ids = [c["id"] for c in campaigns]
        pipeline = [{"$match": {"campaign_id": {"$in": campaign_ids}}}, {"$group": {"_id": "$campaign_id", "count": {"$sum": 1}}}]
        counts = {doc["_id"]: doc["count"] async for doc in db.posts.aggregate(pipeline)}
        for c in campaigns:
            c["post_count"] = counts.get(c["id"], 0)
    return campaigns

@api.post("/campaigns")
async def create_campaign(data: CampaignCreate, user=Depends(get_current_user)):
    campaign = Campaign(**data.model_dump(), created_by=user["user_id"])
    doc = campaign.model_dump()
    await db.campaigns.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, user=Depends(get_current_user)):
    c = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Campaign not found")
    c["posts"] = await db.posts.find({"campaign_id": campaign_id}, {"_id": 0}).to_list(100)
    return c

@api.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignCreate, user=Depends(get_current_user)):
    await db.campaigns.update_one({"id": campaign_id}, {"$set": data.model_dump()})
    return await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})

@api.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user=Depends(get_current_user)):
    await db.campaigns.delete_one({"id": campaign_id})
    await db.posts.delete_many({"campaign_id": campaign_id})
    return {"deleted": True}

@api.post("/campaigns/{campaign_id}/ideate")
async def ideate_campaign(campaign_id: str, data: CampaignIdeationRequest, user=Depends(get_current_user)):
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    brand = await db.brands.find_one({"id": campaign.get("brand_id")}, {"_id": 0}) if campaign else None
    result = await ai_service.ideate_campaign(data.topic, data.objective, data.audience, data.duration_days, brand.get("voice") if brand else None)
    return result

# ─── Posts ───
@api.get("/posts")
async def get_posts(brand_id: Optional[str] = None, campaign_id: Optional[str] = None, status: Optional[str] = None, user=Depends(get_current_user)):
    query = {}
    if brand_id:
        query["brand_id"] = brand_id
    if campaign_id:
        query["campaign_id"] = campaign_id
    if status:
        query["status"] = status
    if not brand_id and not campaign_id:
        brands = await db.brands.find({"user_id": user["user_id"]}, {"id": 1, "_id": 0}).to_list(50)
        query["brand_id"] = {"$in": [b["id"] for b in brands]}
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return posts

@api.post("/posts")
async def create_post(data: PostCreate, user=Depends(get_current_user)):
    post = Post(**data.model_dump())
    doc = post.model_dump()
    await db.posts.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.get("/posts/{post_id}")
async def get_post(post_id: str, user=Depends(get_current_user)):
    p = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Post not found")
    p["variations"] = await db.post_variations.find({"post_id": post_id}, {"_id": 0}).to_list(20)
    p["media"] = await db.media_assets.find({"post_id": post_id}, {"_id": 0}).to_list(20)
    p["metrics"] = await db.post_metrics.find({"post_id": post_id}, {"_id": 0}).to_list(50)
    return p

@api.put("/posts/{post_id}")
async def update_post(post_id: str, data: dict, user=Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("id", None)
    await db.posts.update_one({"id": post_id}, {"$set": data})
    return await db.posts.find_one({"id": post_id}, {"_id": 0})

@api.delete("/posts/{post_id}")
async def delete_post(post_id: str, user=Depends(get_current_user)):
    await db.posts.delete_one({"id": post_id})
    return {"deleted": True}

# ─── AI Generation ───
@api.post("/generate/text")
async def generate_text(data: TextGenerationRequest, user=Depends(get_current_user)):
    results = await ai_service.generate_text_all_models(data.brief, data.platform, data.tone, data.brand_voice)
    return {"variations": results}

@api.post("/generate/text/{post_id}")
async def generate_text_for_post(post_id: str, data: TextGenerationRequest, user=Depends(get_current_user)):
    results = await ai_service.generate_text_all_models(data.brief, data.platform, data.tone, data.brand_voice)
    for r in results:
        variation = PostVariation(post_id=post_id, model=r["model"], caption=r["caption"], hashtags=r.get("hashtags", []), score=r.get("score", 0))
        doc = variation.model_dump()
        await db.post_variations.insert_one(doc)
    return {"variations": results}

@api.post("/generate/variations")
async def generate_variations(data: dict, user=Depends(get_current_user)):
    caption = data.get("caption", "")
    count = data.get("count", 5)
    results = await ai_service.generate_caption_variations(caption, count)
    return {"variations": results}

@api.post("/generate/image")
async def generate_image(data: ImageGenerationRequest, user=Depends(get_current_user)):
    result = await ai_service.generate_image(data.prompt, data.brand_colors)
    return result

@api.post("/generate/image/{post_id}")
async def generate_image_for_post(post_id: str, data: ImageGenerationRequest, user=Depends(get_current_user)):
    result = await ai_service.generate_image(data.prompt, data.brand_colors)
    if result.get("success"):
        from models import MediaAsset
        asset = MediaAsset(post_id=post_id, brand_id="", type="image", storage_url=result["image_url"], prompt=data.prompt, model="nano-banana")
        doc = asset.model_dump()
        await db.media_assets.insert_one(doc)
    return result

@api.post("/generate/video")
async def generate_video_endpoint(data: VideoGenerationRequest, user=Depends(get_current_user)):
    result = await ai_service.submit_video_async(data.prompt, data.duration, data.aspect_ratio)
    return result

@api.get("/generate/video/status/{request_id}")
async def video_status(request_id: str, user=Depends(get_current_user)):
    return await ai_service.check_video_status(request_id)

@api.get("/generate/video/result/{request_id}")
async def video_result(request_id: str, user=Depends(get_current_user)):
    return await ai_service.get_video_result(request_id)

# ─── Schedule ───
@api.get("/schedules")
async def get_schedules(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    if brand_id:
        posts = await db.posts.find({"brand_id": brand_id}, {"id": 1, "_id": 0}).to_list(500)
        post_ids = [p["id"] for p in posts]
        schedules = await db.schedules.find({"post_id": {"$in": post_ids}}, {"_id": 0}).to_list(500)
    else:
        schedules = await db.schedules.find({}, {"_id": 0}).to_list(500)
    if schedules:
        sched_post_ids = [s.get("post_id") for s in schedules if s.get("post_id")]
        posts_map = {}
        if sched_post_ids:
            sched_posts = await db.posts.find({"id": {"$in": sched_post_ids}}, {"_id": 0}).to_list(500)
            posts_map = {p["id"]: p for p in sched_posts}
        for s in schedules:
            s["post"] = posts_map.get(s.get("post_id"))
    return schedules

@api.post("/schedules")
async def create_schedule(data: ScheduleCreate, user=Depends(get_current_user)):
    schedule = Schedule(**data.model_dump())
    doc = schedule.model_dump()
    await db.schedules.insert_one(doc)
    await db.posts.update_one({"id": data.post_id}, {"$set": {"status": "scheduled", "scheduled_at": data.scheduled_at}})
    return {k: v for k, v in doc.items() if k != "_id"}

@api.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, user=Depends(get_current_user)):
    sched = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if sched:
        await db.posts.update_one({"id": sched["post_id"]}, {"$set": {"status": "draft", "scheduled_at": None}})
    await db.schedules.delete_one({"id": schedule_id})
    return {"deleted": True}

@api.get("/schedules/optimal-times")
async def optimal_times(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    return {
        "instagram": ["09:00", "12:30", "18:00"],
        "twitter": ["08:00", "12:00", "17:00"],
        "linkedin": ["07:30", "12:00", "17:30"],
        "tiktok": ["11:00", "15:00", "19:00"],
        "facebook": ["09:00", "13:00", "16:00"],
    }

# ─── Analytics ───
@api.get("/analytics/overview")
async def analytics_overview(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = None
    if brand_id:
        brand = await db.brands.find_one({"id": brand_id}, {"_id": 0})
    else:
        brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    total_posts = await db.posts.count_documents({"brand_id": bid})
    scheduled = await db.posts.count_documents({"brand_id": bid, "status": "scheduled"})
    published = await db.posts.count_documents({"brand_id": bid, "status": "published"})
    accounts = await db.social_accounts.find({"brand_id": bid}, {"_id": 0}).to_list(20)
    total_followers = sum(a.get("followers", 0) for a in accounts)
    return {
        "total_posts": total_posts, "scheduled_posts": scheduled, "published_posts": published,
        "total_followers": total_followers, "accounts": len(accounts),
        "engagement_rate": 4.2, "reach_growth": 12.5, "follower_growth": 2.8,
    }

@api.get("/analytics/platform-metrics")
async def platform_metrics(days: int = 30, user=Depends(get_current_user)):
    return mock_data.generate_platform_metrics_series(days)

@api.get("/analytics/post-performance")
async def post_performance(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    posts = await db.posts.find({"brand_id": brand_id} if brand_id else {}, {"_id": 0}).sort("created_at", -1).to_list(50)
    if posts:
        post_ids = [p["id"] for p in posts]
        all_metrics = await db.post_metrics.find({"post_id": {"$in": post_ids}}, {"_id": 0}).to_list(500)
        metrics_map = {}
        for m in all_metrics:
            if m["post_id"] not in metrics_map:
                metrics_map[m["post_id"]] = m
        for p in posts:
            p["metrics"] = metrics_map.get(p["id"], mock_data.generate_mock_metrics(p["id"], p.get("platforms", ["instagram"])[0] if p.get("platforms") else "instagram"))
    return posts

# ─── Audience ───
@api.get("/audience/insights")
async def audience_insights(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    return mock_data.generate_mock_audience()

@api.get("/audience/active-hours")
async def active_hours(user=Depends(get_current_user)):
    aud = mock_data.generate_mock_audience()
    return aud["active_hours"]

# ─── Trends ───
@api.get("/trends")
async def get_trends(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0}) if not brand_id else await db.brands.find_one({"id": brand_id}, {"_id": 0})
    bid = brand["id"] if brand else ""
    stored = await db.trends.find({"brand_id": bid}, {"_id": 0}).to_list(20)
    if stored:
        return stored
    trends = mock_data.generate_mock_trends(bid, brand.get("industry", "general") if brand else "general")
    if trends:
        await db.trends.insert_many(trends)
    return trends

@api.post("/trends/refresh")
async def refresh_trends(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    await db.trends.delete_many({"brand_id": bid})
    trends = mock_data.generate_mock_trends(bid)
    await db.trends.insert_many(trends)
    return trends

# ─── Competitors ───
@api.get("/competitors")
async def get_competitors(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0}) if not brand_id else await db.brands.find_one({"id": brand_id}, {"_id": 0})
    bid = brand["id"] if brand else ""
    comps = await db.competitors.find({"brand_id": bid}, {"_id": 0}).to_list(20)
    if not comps:
        comps = mock_data.generate_mock_competitors(bid)
        await db.competitors.insert_many([{**c} for c in comps])
        comps = await db.competitors.find({"brand_id": bid}, {"_id": 0}).to_list(20)
    return comps

@api.post("/competitors")
async def add_competitor(data: CompetitorCreate, brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    comp = Competitor(brand_id=bid, **data.model_dump())
    doc = comp.model_dump()
    await db.competitors.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.delete("/competitors/{comp_id}")
async def delete_competitor(comp_id: str, user=Depends(get_current_user)):
    await db.competitors.delete_one({"id": comp_id})
    return {"deleted": True}

# ─── Sentiment ───
@api.get("/sentiment")
async def get_sentiment(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    logs = await db.sentiment_logs.find({}, {"_id": 0}).sort("logged_at", -1).to_list(100)
    return logs

@api.post("/sentiment/analyze")
async def analyze_sentiment(data: dict, user=Depends(get_current_user)):
    comments = data.get("comments", [])
    if not comments:
        return {"results": []}
    results = await ai_service.classify_sentiment(comments)
    for r in results:
        r["id"] = new_id()
        r["post_id"] = data.get("post_id", "")
        r["platform"] = data.get("platform", "")
        r["logged_at"] = utc_now().isoformat()
        await db.sentiment_logs.insert_one({**r})
    return {"results": results}

# ─── Alerts ───
@api.get("/alerts")
async def get_alerts(brand_id: Optional[str] = None, resolved: Optional[bool] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    query = {"brand_id": bid}
    if resolved is not None:
        query["resolved"] = resolved
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    if not alerts:
        alerts = mock_data.generate_mock_alerts(bid)
        await db.alerts.insert_many([{**a} for a in alerts])
        alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return alerts

@api.put("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(get_current_user)):
    await db.alerts.update_one({"id": alert_id}, {"$set": {"resolved": True}})
    return {"resolved": True}

@api.get("/alerts/boost-suggestions")
async def get_boost_suggestions(user=Depends(get_current_user)):
    suggestions = await db.boost_suggestions.find({}, {"_id": 0}).to_list(20)
    return suggestions

# ─── Reports ───
@api.get("/reports/weekly")
async def get_weekly_reports(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    reports = await db.weekly_reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    return reports

@api.post("/reports/generate")
async def generate_report(data: dict, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    week_data = mock_data.generate_weekly_report_data(bid)
    report_content = await ai_service.generate_weekly_report(week_data)
    report = WeeklyReport(
        brand_id=bid,
        week_start=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        summary_json=report_content,
        top_posts=report_content.get("top_posts", []),
        recommendations=report_content.get("recommendations", []),
    )
    doc = report.model_dump()
    await db.weekly_reports.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

# ─── Team ───
@api.get("/team")
async def get_team(brand_id: Optional[str] = None, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    members = await db.team_members.find({"brand_id": bid}, {"_id": 0}).to_list(50)
    return members

@api.post("/team")
async def add_team_member(data: TeamMemberCreate, user=Depends(get_current_user)):
    brand = await db.brands.find_one({"user_id": user["user_id"]}, {"_id": 0})
    bid = brand["id"] if brand else ""
    member = TeamMember(brand_id=bid, user_id=new_id(), **data.model_dump())
    doc = member.model_dump()
    await db.team_members.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api.delete("/team/{member_id}")
async def remove_team_member(member_id: str, user=Depends(get_current_user)):
    await db.team_members.delete_one({"id": member_id})
    return {"deleted": True}

@api.put("/team/{member_id}")
async def update_team_role(member_id: str, data: dict, user=Depends(get_current_user)):
    await db.team_members.update_one({"id": member_id}, {"$set": {"role": data.get("role", "viewer")}})
    return await db.team_members.find_one({"id": member_id}, {"_id": 0})

# ─── AI Performance Analysis ───
@api.post("/analytics/ai-analyze")
async def ai_analyze(data: dict, user=Depends(get_current_user)):
    return await ai_service.analyze_performance(data.get("metrics", {}), data.get("period", "7d"))

# ─── Health ───
@api.get("/")
async def root():
    return {"message": "SolisBoard API v1.0", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Render and monitoring"""
    return {"status": "healthy", "service": "solis-backend"}

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
