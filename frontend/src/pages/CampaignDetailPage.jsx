import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { campaigns as campaignsApi } from "@/lib/api";
import {
  ArrowLeft, Sparkles, Loader2, Target, Calendar, CheckCircle2, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ideating, setIdeating] = useState(false);
  const [ideation, setIdeation] = useState(null);
  const [ideationForm, setIdeationForm] = useState({
    topic: "", objective: "awareness", audience: "", duration_days: 30,
  });

  useEffect(() => {
    campaignsApi.get(id).then((r) => { setCampaign(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleIdeate = async (e) => {
    e.preventDefault();
    if (!ideationForm.topic || !ideationForm.audience) {
      toast.error("Topic and audience are required");
      return;
    }
    setIdeating(true);
    setIdeation(null);
    try {
      const res = await campaignsApi.ideate(id, {
        ...ideationForm,
        brand_voice: user?.brand?.voice,
      });
      setIdeation(res.data);
      toast.success("Campaign concepts generated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Ideation failed");
    } finally {
      setIdeating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  if (!campaign) return (
    <div className="p-8 text-center">
      <p className="text-zinc-500">Campaign not found</p>
      <Link to="/campaigns"><Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300">Back to Campaigns</Button></Link>
    </div>
  );

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="campaign-detail-page">
      {/* Header */}
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Campaigns
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">{campaign.name}</h1>
          <p className="text-zinc-500 mt-1 text-sm max-w-xl">{campaign.brief}</p>
          <div className="flex items-center gap-3 mt-3">
            {campaign.goal && (
              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                <Target className="w-3 h-3 mr-1" />{campaign.goal}
              </Badge>
            )}
            {campaign.start_date && (
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                <Calendar className="w-3 h-3 mr-1" />{campaign.start_date} — {campaign.end_date || "Ongoing"}
              </Badge>
            )}
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{campaign.status}</Badge>
          </div>
        </div>
      </div>

      {/* AI Ideation Engine — Module 1 */}
      <div className="card-grid-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white font-[Outfit]">AI Campaign Ideation</h2>
            <p className="text-xs text-zinc-500">Generate 3-5 campaign concepts with AI-powered strategy</p>
          </div>
        </div>

        <form onSubmit={handleIdeate} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Topic / Theme</Label>
            <Input
              data-testid="ideation-topic-input"
              value={ideationForm.topic}
              onChange={(e) => setIdeationForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="e.g., Summer product launch, Holiday sale"
              className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Target Audience</Label>
            <Input
              data-testid="ideation-audience-input"
              value={ideationForm.audience}
              onChange={(e) => setIdeationForm((p) => ({ ...p, audience: e.target.value }))}
              placeholder="e.g., Young professionals 25-35, tech-savvy"
              className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Objective</Label>
            <Input
              data-testid="ideation-objective-input"
              value={ideationForm.objective}
              onChange={(e) => setIdeationForm((p) => ({ ...p, objective: e.target.value }))}
              placeholder="Brand awareness, lead generation..."
              className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Duration (days)</Label>
            <Input
              type="number" data-testid="ideation-duration-input"
              value={ideationForm.duration_days}
              onChange={(e) => setIdeationForm((p) => ({ ...p, duration_days: parseInt(e.target.value) || 30 }))}
              className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white h-10"
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit" data-testid="ideate-btn" disabled={ideating}
              className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 h-10 px-6"
            >
              {ideating ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating concepts...</span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate Campaign Concepts</span>
              )}
            </Button>
          </div>
        </form>

        {/* Ideation Results */}
        {ideation && ideation.concepts && (
          <div className="space-y-4 animate-fade-in" data-testid="ideation-results">
            <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Generated Concepts ({ideation.concepts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ideation.concepts.map((concept, i) => (
                <div
                  key={i}
                  data-testid={`concept-card-${i}`}
                  className="border border-zinc-800 bg-zinc-900/40 rounded-lg p-4 hover:border-orange-500/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white mb-1">{concept.name || concept.title}</h4>
                      {concept.tagline && <p className="text-xs text-orange-400 mb-2 italic">"{concept.tagline}"</p>}
                      {concept.angle && <p className="text-xs text-zinc-400 mb-2">{concept.angle}</p>}
                      {concept.content_pillars && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {concept.content_pillars.map((p, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{p}</span>
                          ))}
                        </div>
                      )}
                      {concept.post_types && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {concept.post_types.map((t, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {ideation.calendar_outline && ideation.calendar_outline.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" /> 30-Day Content Calendar
                </h3>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="text-[10px] text-zinc-500 text-center font-semibold py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {ideation.calendar_outline.map((item, i) => {
                    const typeColors = {
                      carousel: "border-purple-500/40 bg-purple-500/5",
                      video: "border-blue-500/40 bg-blue-500/5",
                      image: "border-emerald-500/40 bg-emerald-500/5",
                      story: "border-pink-500/40 bg-pink-500/5",
                      reel: "border-rose-500/40 bg-rose-500/5",
                    };
                    const colorClass = typeColors[item.post_type?.toLowerCase()] || "border-zinc-800 bg-zinc-900/30";
                    return (
                      <div key={i} className={`border rounded-lg p-2 min-h-[80px] ${colorClass} hover:border-orange-500/50 transition-colors cursor-pointer group`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-orange-400">Day {item.day}</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">{item.platform}</span>
                        </div>
                        <p className="text-[10px] text-zinc-300 line-clamp-2 leading-tight">{item.topic}</p>
                        <p className="text-[8px] text-zinc-500 mt-1 capitalize">{item.post_type}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-purple-500/40 bg-purple-500/10"></span> Carousel</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-blue-500/40 bg-blue-500/10"></span> Video</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-emerald-500/40 bg-emerald-500/10"></span> Image</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-pink-500/40 bg-pink-500/10"></span> Story</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-rose-500/40 bg-rose-500/10"></span> Reel</span>
                </div>
              </div>
            )}
          </div>
        )}

        {ideation && ideation.error && (
          <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
            Error: {ideation.error}
          </div>
        )}
      </div>

      {/* Posts List */}
      {campaign.posts && campaign.posts.length > 0 && (
        <div className="card-grid-border p-6">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Campaign Posts ({campaign.posts.length})</h3>
          <div className="space-y-2">
            {campaign.posts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/40">
                <CheckCircle2 className={`w-4 h-4 ${p.status === "published" ? "text-emerald-400" : "text-zinc-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{p.caption || "Untitled"}</p>
                  <p className="text-xs text-zinc-500">{p.platforms?.join(", ")} · {p.post_type}</p>
                </div>
                <span className="text-xs text-zinc-500 capitalize">{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
