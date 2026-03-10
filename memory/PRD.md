# SolisBoard - AI-Powered Social Media Marketing Platform

## Problem Statement
Build an AI-powered automated social media marketing tool (SolisBoard) that manages and optimizes campaigns. The system automatically generates social media content, schedules posts at optimal times, analyzes audience behavior, and tracks engagement metrics.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (dark theme, zinc/orange palette, Outfit + DM Sans fonts)
- **Backend**: FastAPI (Python) on port 8001
- **Database**: MongoDB (local, DB: solisboard)
- **AI Text**: Claude Sonnet, GPT-4o, Gemini Flash (via Emergent LLM Key)
- **AI Image**: Nano Banana / Gemini Pro Image Preview (via Emergent LLM Key)
- **AI Video**: Google Veo3 (via fal.ai)
- **Auth**: JWT-based (bcrypt + PyJWT)
- **Social Media**: Mocked publishing layer

## User Personas
- Social media managers
- Digital marketing agencies
- Brand managers & content creators

## Core Requirements
1. Campaign Ideation Engine (AI-generated concepts + calendar)
2. Multi-Model Text Generation (Claude + GPT-4o + Gemini side-by-side)
3. Caption Variations & Hashtags (6 style variations per caption)
4. AI Image Generation (Nano Banana)
5. AI Video Generation (Google Veo3 via fal.ai)
6. Trend Analysis Engine (trending topics with virality scores)
7. Auto-Schedule (content calendar with optimal times)
8. Auto-Boost Suggestions
9. Underperforming Post Alerts
10. Analytics Dashboard (cross-platform charts, engagement, reach, followers)
11. Audience Behaviour Insights (demographics, active hours heatmap, locations)
12. Sentiment Analysis (AI-powered comment classification)
13. Competitor Tracker (benchmarks, follower growth, post frequency)
14. Weekly AI Report (AI-generated summaries, recommendations, next-week plans)
15. Multi-Account Management (brand profile, social accounts, team roles)

## What's Been Implemented (Feb 2026)
- All 15 modules fully built (frontend + backend)
- JWT authentication (register/login)
- Full sidebar navigation with 3 sections (Core, Intelligence, Operations)
- Dashboard with stats, quick actions, recent posts, campaigns, alerts
- Campaign CRUD + AI ideation (Claude-powered concept generation)
- Multi-model text generation (3 models in parallel)
- Caption variation generator
- Image generation (Nano Banana)
- Video generation (Veo3 via fal.ai async queue)
- Content calendar with weekly view + scheduling
- Analytics dashboard with Recharts (engagement, reach, follower charts)
- Audience insights (age, gender pie charts, active hours heatmap, locations, interests)
- Trend analysis with refresh + create-from-trend
- Competitor tracker with add/remove + metrics
- Sentiment analysis with AI classification
- Alerts center with tabs (active/resolved/boosts)
- Weekly AI report generator
- Settings page (brand profile, social accounts CRUD, team management with roles)
- N+1 query optimizations (aggregation pipelines + batch queries)
- Deployment readiness verified

## Prioritized Backlog

### P0 (Critical)
- Real social media API integrations (Instagram Graph API, Twitter API, LinkedIn API)
- Supabase migration (user requested Supabase, currently using MongoDB)

### P1 (High)
- Real-time webhook handlers for social platform metrics
- PDF export for weekly reports
- Drag-and-drop calendar scheduling
- A/B testing module for caption variations

### P2 (Medium)
- Email notifications for alerts
- Content approval workflows (multi-user)
- Custom brand color injection into AI image prompts
- Campaign template library
- Hashtag research tool

## Next Tasks
1. Migrate from MongoDB to Supabase (user's original requirement)
2. Connect real social media platform APIs
3. Add drag-and-drop to content calendar
4. Implement PDF report export
5. Add real-time metrics polling
