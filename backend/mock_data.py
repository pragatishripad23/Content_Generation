import random
from datetime import datetime, timezone, timedelta
import uuid


def generate_mock_metrics(post_id: str, platform: str, days_ago: int = 0) -> dict:
    base = random.randint(50, 500)
    return {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "platform": platform,
        "likes": base + random.randint(0, 200),
        "comments": random.randint(5, 80),
        "shares": random.randint(2, 50),
        "saves": random.randint(1, 30),
        "reach": base * random.randint(5, 20),
        "impressions": base * random.randint(10, 40),
        "clicks": random.randint(10, 100),
        "fetched_at": (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat(),
    }


def generate_mock_audience() -> dict:
    return {
        "age_range": {"18-24": 22, "25-34": 35, "35-44": 25, "45-54": 12, "55+": 6},
        "gender": {"male": 42, "female": 53, "other": 5},
        "top_locations": ["New York", "Los Angeles", "London", "Toronto", "Sydney"],
        "active_hours": {
            "monday": [8, 9, 12, 13, 17, 18, 19, 20],
            "tuesday": [8, 9, 12, 13, 17, 18, 19, 20, 21],
            "wednesday": [9, 12, 13, 17, 18, 19, 20],
            "thursday": [8, 9, 12, 17, 18, 19, 20, 21],
            "friday": [9, 12, 13, 17, 18, 19, 20],
            "saturday": [10, 11, 12, 14, 15, 16, 17, 18],
            "sunday": [10, 11, 12, 14, 15, 16, 17],
        },
        "interests": [
            "Technology", "Fashion", "Travel", "Food", "Fitness",
            "Photography", "Music", "Gaming", "Business", "Art",
        ],
    }


def generate_mock_trends(brand_id: str, industry: str = "general") -> list:
    topics = [
        ("AI in Marketing", "How brands leverage AI for content creation", 92),
        ("Sustainability", "Eco-friendly brand messaging", 87),
        ("Short-form Video", "Reels and TikTok dominating engagement", 95),
        ("Authentic Content", "Behind-the-scenes and raw content", 83),
        ("Community Building", "Brand communities driving loyalty", 78),
        ("Voice Search Optimization", "Adapting content for voice", 65),
        ("Interactive Polls", "Engagement through interactive content", 88),
        ("Micro-Influencers", "Collaborating with niche creators", 80),
        ("Social Commerce", "Direct shopping from social posts", 91),
        ("Personalization", "Tailored content for audience segments", 76),
    ]
    return [
        {
            "id": str(uuid.uuid4()),
            "brand_id": brand_id,
            "topic": t[0],
            "platform": random.choice(["instagram", "twitter", "linkedin", "tiktok"]),
            "score": t[2] + random.randint(-5, 5),
            "relevance": random.randint(60, 99),
            "suggested_angle": t[1],
            "detected_at": datetime.now(timezone.utc).isoformat(),
        }
        for t in topics
    ]


def generate_mock_competitors(brand_id: str) -> list:
    competitors = [
        {"handle": "@competitor_alpha", "platform": "instagram"},
        {"handle": "@rival_brand", "platform": "twitter"},
        {"handle": "@industry_leader", "platform": "linkedin"},
    ]
    return [
        {
            "id": str(uuid.uuid4()),
            "brand_id": brand_id,
            "platform": c["platform"],
            "handle": c["handle"],
            "post_count_week": random.randint(3, 15),
            "avg_engagement": round(random.uniform(1.5, 8.0), 2),
            "top_post_url": f"https://example.com/post/{random.randint(1000, 9999)}",
            "follower_growth": round(random.uniform(-0.5, 3.0), 2),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        for c in competitors
    ]


def generate_mock_alerts(brand_id: str) -> list:
    alert_types = [
        ("underperform", "high", "Post engagement dropped 40% below average"),
        ("boost", "medium", "Post performing 3x above average - consider boosting"),
        ("trend", "low", "New trending topic detected in your niche"),
        ("sentiment", "high", "Negative sentiment spike detected on recent post"),
    ]
    return [
        {
            "id": str(uuid.uuid4()),
            "brand_id": brand_id,
            "post_id": str(uuid.uuid4()),
            "type": a[0],
            "severity": a[1],
            "message": a[2],
            "ai_diagnosis": f"AI analysis suggests reviewing content strategy for {a[0]} issues.",
            "resolved": random.choice([True, False]),
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48))).isoformat(),
        }
        for a in alert_types
    ]


def generate_platform_metrics_series(days: int = 30) -> list:
    series = []
    for i in range(days):
        date = (datetime.now(timezone.utc) - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
        series.append({
            "date": date,
            "instagram": {"followers": 5000 + i * random.randint(5, 20), "engagement": round(random.uniform(2.0, 6.0), 2), "reach": random.randint(2000, 8000)},
            "twitter": {"followers": 3200 + i * random.randint(3, 12), "engagement": round(random.uniform(1.0, 4.0), 2), "reach": random.randint(1500, 6000)},
            "linkedin": {"followers": 1800 + i * random.randint(2, 8), "engagement": round(random.uniform(1.5, 5.0), 2), "reach": random.randint(1000, 4000)},
            "tiktok": {"followers": 8000 + i * random.randint(10, 40), "engagement": round(random.uniform(3.0, 10.0), 2), "reach": random.randint(5000, 20000)},
        })
    return series


def generate_weekly_report_data(brand_id: str) -> dict:
    return {
        "brand_id": brand_id,
        "period": "Last 7 days",
        "total_posts": random.randint(10, 25),
        "total_engagement": random.randint(5000, 25000),
        "follower_growth": round(random.uniform(0.5, 3.5), 2),
        "top_platform": random.choice(["instagram", "tiktok", "linkedin"]),
        "avg_engagement_rate": round(random.uniform(2.0, 7.0), 2),
        "best_post_type": random.choice(["image", "video", "carousel"]),
        "sentiment_avg": round(random.uniform(60, 90), 1),
        "posts_by_platform": {
            "instagram": random.randint(3, 8),
            "twitter": random.randint(5, 12),
            "linkedin": random.randint(2, 5),
            "tiktok": random.randint(1, 4),
        },
    }
