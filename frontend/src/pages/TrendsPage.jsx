import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { trends } from "@/lib/api";
import { TrendingUp, RefreshCw, Loader2, Zap, ExternalLink, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function TrendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const brandId = user?.brand?.id;

  const load = async () => {
    try { const r = await trends.list(brandId); setData(r.data || []); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (brandId) load(); }, [brandId]); // eslint-disable-line

  const handleRefresh = async () => {
    setRefreshing(true);
    try { const r = await trends.refresh(brandId); setData(r.data || []); toast.success("Trends refreshed"); } catch { toast.error("Refresh failed"); } finally { setRefreshing(false); }
  };

  const getScoreColor = (s) => s >= 85 ? "text-emerald-400 bg-emerald-500/10" : s >= 70 ? "text-amber-400 bg-amber-500/10" : "text-zinc-400 bg-zinc-800";
  const platformColor = { instagram: "text-pink-400", twitter: "text-sky-400", linkedin: "text-blue-400", tiktok: "text-purple-400" };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="trends-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Trend Analysis</h1>
          <p className="text-zinc-500 mt-1 text-sm">Trending topics relevant to your niche</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh Trends
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((t, i) => (
          <div key={t.id || i} data-testid={`trend-card-${i}`} className="card-grid-border p-5 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{t.topic}</h3>
                  <span className={`text-[10px] capitalize ${platformColor[t.platform] || "text-zinc-500"}`}>{t.platform}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`score-badge ${getScoreColor(t.score)}`}><Zap className="w-2.5 h-2.5" />{t.score}</span>
              </div>
            </div>
            {t.suggested_angle && <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{t.suggested_angle}</p>}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">Relevance: {t.relevance}%</Badge>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-orange-400 hover:text-orange-300 ml-auto" onClick={() => navigate("/content/create")}>
                <PenTool className="w-3 h-3 mr-1" /> Create from Trend
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
