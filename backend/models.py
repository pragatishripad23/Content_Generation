from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


def new_id():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


# Auth
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    company: Optional[str] = None
    industry: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]


# Brand
class BrandProfile(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    name: str
    voice: Optional[str] = "professional"
    colors: Optional[List[str]] = []
    fonts: Optional[List[str]] = []
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    keywords: Optional[List[str]] = []
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


class BrandProfileCreate(BaseModel):
    name: str
    voice: Optional[str] = "professional"
    colors: Optional[List[str]] = []
    fonts: Optional[List[str]] = []
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    keywords: Optional[List[str]] = []


# Social Accounts
class SocialAccount(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    platform: str
    handle: str
    followers: int = 0
    connected_at: str = Field(default_factory=lambda: utc_now().isoformat())


class SocialAccountCreate(BaseModel):
    platform: str
    handle: str
    followers: Optional[int] = 0


# Campaign
class Campaign(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    name: str
    brief: str
    goal: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "draft"
    created_by: str = ""
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())
    post_count: int = 0


class CampaignCreate(BaseModel):
    brand_id: str
    name: str
    brief: str
    goal: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


# Posts
class Post(BaseModel):
    id: str = Field(default_factory=new_id)
    campaign_id: Optional[str] = None
    brand_id: str
    platforms: List[str] = []
    caption: str = ""
    media_urls: List[str] = []
    status: str = "draft"
    scheduled_at: Optional[str] = None
    published_at: Optional[str] = None
    post_type: str = "image"
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


class PostCreate(BaseModel):
    brand_id: str
    campaign_id: Optional[str] = None
    platforms: List[str] = []
    caption: Optional[str] = ""
    post_type: str = "image"
    scheduled_at: Optional[str] = None


# Post Variations
class PostVariation(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    model: str
    caption: str
    hashtags: List[str] = []
    score: float = 0.0
    selected: bool = False


# Caption Variations
class CaptionVariation(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    variation_type: str
    caption: str
    platform: str = "general"


# Media Assets
class MediaAsset(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    post_id: Optional[str] = None
    type: str = "image"
    storage_url: str = ""
    prompt: Optional[str] = None
    model: Optional[str] = None
    dimensions: Optional[str] = None
    selected: bool = False
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Schedule
class Schedule(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    scheduled_at: str
    timezone: str = "UTC"
    auto_scheduled: bool = False
    status: str = "pending"
    fired_at: Optional[str] = None


class ScheduleCreate(BaseModel):
    post_id: str
    scheduled_at: str
    timezone: Optional[str] = "UTC"
    auto_scheduled: Optional[bool] = False


# Metrics
class PostMetrics(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    platform: str
    likes: int = 0
    comments: int = 0
    shares: int = 0
    saves: int = 0
    reach: int = 0
    impressions: int = 0
    clicks: int = 0
    fetched_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Sentiment
class SentimentLog(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    comment_text: str
    sentiment: str = "neutral"
    score: float = 0.0
    platform: str = ""
    logged_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Audience
class AudienceInsight(BaseModel):
    id: str = Field(default_factory=new_id)
    social_account_id: str
    age_range: Dict[str, float] = {}
    gender: Dict[str, float] = {}
    top_locations: List[str] = []
    active_hours: Dict[str, List[int]] = {}
    interests: List[str] = []
    date: str = Field(default_factory=lambda: utc_now().isoformat())


# Competitor
class Competitor(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    platform: str
    handle: str
    post_count_week: int = 0
    avg_engagement: float = 0.0
    top_post_url: Optional[str] = None
    follower_growth: float = 0.0
    fetched_at: str = Field(default_factory=lambda: utc_now().isoformat())


class CompetitorCreate(BaseModel):
    platform: str
    handle: str


# Trends
class Trend(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    topic: str
    platform: str = "general"
    score: float = 0.0
    relevance: float = 0.0
    suggested_angle: Optional[str] = None
    detected_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Alerts
class Alert(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    post_id: Optional[str] = None
    type: str
    severity: str = "medium"
    message: str
    ai_diagnosis: Optional[str] = None
    resolved: bool = False
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Boost Suggestion
class BoostSuggestion(BaseModel):
    id: str = Field(default_factory=new_id)
    post_id: str
    reason: str
    estimated_reach: int = 0
    suggested_budget: float = 0.0
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Weekly Report
class WeeklyReport(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    week_start: str
    summary_json: Dict[str, Any] = {}
    top_posts: List[str] = []
    recommendations: List[str] = []
    pdf_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: utc_now().isoformat())


# Team
class TeamMember(BaseModel):
    id: str = Field(default_factory=new_id)
    brand_id: str
    user_id: str
    role: str = "viewer"
    email: str = ""
    name: str = ""
    added_at: str = Field(default_factory=lambda: utc_now().isoformat())


class TeamMemberCreate(BaseModel):
    email: str
    name: str
    role: str = "editor"


# AI Generation Requests
class TextGenerationRequest(BaseModel):
    brief: str
    platform: str = "instagram"
    tone: str = "professional"
    brand_voice: Optional[str] = None
    brand_keywords: Optional[List[str]] = []


class ImageGenerationRequest(BaseModel):
    prompt: str
    brand_colors: Optional[List[str]] = []
    style: str = "modern"
    count: int = 4


class VideoGenerationRequest(BaseModel):
    prompt: str
    duration: str = "8s"
    aspect_ratio: str = "16:9"
    resolution: str = "720p"
    image_url: Optional[str] = None


class CampaignIdeationRequest(BaseModel):
    topic: str
    objective: str
    audience: str
    duration_days: int = 30
    brand_voice: Optional[str] = None
