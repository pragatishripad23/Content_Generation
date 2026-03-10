import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { alerts as alertsApi } from "@/lib/api";
import { AlertTriangle, Zap, TrendingUp, MessageCircle, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const typeIcons = { underperform: AlertTriangle, boost: Zap, trend: TrendingUp, sentiment: MessageCircle };
const typeColors = {
  underperform: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  boost: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  trend: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  sentiment: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};
const sevColors = { high: "text-rose-400", medium: "text-amber-400", low: "text-zinc-400" };

export default function AlertsPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const brandId = user?.brand?.id;

  const load = async () => {
    try {
      const [a, b] = await Promise.all([alertsApi.list(brandId), alertsApi.boostSuggestions()]);
      setData(a.data || []);
      setBoosts(b.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (brandId) load(); }, [brandId]); // eslint-disable-line

  const handleResolve = async (id) => {
    await alertsApi.resolve(id);
    toast.success("Alert resolved");
    load();
  };

  const active = data.filter((a) => !a.resolved);
  const resolved = data.filter((a) => a.resolved);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="alerts-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Alerts & Boost Suggestions</h1>
        <p className="text-zinc-500 mt-1 text-sm">Underperforming post alerts and auto-boost recommendations</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="active" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">Resolved ({resolved.length})</TabsTrigger>
          <TabsTrigger value="boosts" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Boosts ({boosts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-3">
            {active.length === 0 && <div className="card-grid-border p-8 text-center"><CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-zinc-400 text-sm">All clear! No active alerts.</p></div>}
            {active.map((a, i) => {
              const Icon = typeIcons[a.type] || AlertTriangle;
              return (
                <div key={a.id || i} data-testid={`alert-card-${i}`} className="card-grid-border p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[a.type]?.split(" ")[0] || "bg-zinc-800"}`}>
                      <Icon className={`w-4 h-4 ${typeColors[a.type]?.split(" ")[1] || "text-zinc-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] ${typeColors[a.type] || ""}`}>{a.type}</Badge>
                        <span className={`text-[10px] font-semibold ${sevColors[a.severity] || "text-zinc-500"}`}>{a.severity}</span>
                      </div>
                      <p className="text-sm text-zinc-200 mb-1">{a.message}</p>
                      {a.ai_diagnosis && <p className="text-xs text-zinc-500 italic">{a.ai_diagnosis}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleResolve(a.id)} className="text-xs text-zinc-500 hover:text-emerald-400 shrink-0">
                      <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="space-y-2">
            {resolved.map((a, i) => (
              <div key={a.id || i} className="card-grid-border p-3 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm text-zinc-400 flex-1">{a.message}</p>
                  <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">{a.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="boosts">
          {boosts.length === 0 ? (
            <div className="card-grid-border p-8 text-center"><Zap className="w-8 h-8 text-zinc-700 mx-auto mb-2" /><p className="text-zinc-500 text-sm">No boost suggestions yet. Posts need engagement data first.</p></div>
          ) : (
            <div className="space-y-3">
              {boosts.map((b, i) => (
                <div key={b.id || i} className="card-grid-border p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-zinc-200">{b.reason}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-500">
                    <span>Est. Reach: {b.estimated_reach?.toLocaleString()}</span>
                    <span>Budget: ${b.suggested_budget}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
