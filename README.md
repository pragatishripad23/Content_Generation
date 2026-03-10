# SOLIS - Social Media Content Generation Platform

A full-stack social media content generation and management platform with AI-powered features.

## 🏗️ Architecture

- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS
- **AI Services**: Claude, GPT-4, Gemini for content generation

## 🚀 Quick Deploy to Render

### One-Click Deploy (Recommended)

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` and create both services

### Manual Deploy

#### Backend Setup

1. Create a new **Web Service** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

4. Add Environment Variables:
   | Variable | Description |
   |----------|-------------|
   | `MONGO_URL` | MongoDB connection string |
   | `DB_NAME` | Database name (e.g., `solisboard`) |
   | `JWT_SECRET` | Secret key for JWT tokens |
   | `CORS_ORIGINS` | Comma-separated allowed origins |
   | `EMERGENT_LLM_KEY` | Emergent LLM API key |
   | `FAL_KEY` | FAL API key for media generation |

#### Frontend Setup

1. Create a new **Static Site** on Render
2. Connect your repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. Add Environment Variables:
   | Variable | Description |
   |----------|-------------|
   | `REACT_APP_BACKEND_URL` | Your backend URL (e.g., `https://solis-backend.onrender.com`) |

5. Add Rewrite Rule:
   - Source: `/*`
   - Destination: `/index.html`
   - Type: Rewrite

## 💻 Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your backend URL

# Run development server
npm start
```

## 📁 Project Structure

```
├── backend/
│   ├── server.py          # FastAPI application
│   ├── ai_service.py      # AI generation services
│   ├── auth.py            # Authentication logic
│   ├── models.py          # Pydantic models
│   ├── mock_data.py       # Mock data generators
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
│   └── package.json       # Node dependencies
└── render.yaml            # Render deployment blueprint
```

## 🔧 Environment Variables

### Backend (.env)

```env
MONGO_URL=mongodb+srv://...
DB_NAME=solisboard
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000,https://your-frontend.onrender.com
EMERGENT_LLM_KEY=your-key
FAL_KEY=your-key
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 🔐 API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/campaigns` - List campaigns
- `POST /api/generate/text` - Generate text content
- `POST /api/generate/image` - Generate images
- `GET /health` - Health check endpoint

## 📝 License

MIT License
