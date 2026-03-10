import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { analytics, posts, campaigns as campaignsApi, alerts as alertsApi } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  BarChart3, TrendingUp, Users, FileText, Plus, ArrowUpRight, Megaphone,
  Bell, PenTool, Calendar, Image, MessageCircle, Swords, Zap, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [campaignList, setCampaignList] = useState([]);
  const [alertList, setAlertList] = useState([]);

  useEffect(() => {
    const brandId = user?.brand?.id;
    if (!brandId) return;
    analytics.overview(brandId).then((r) => setOverview(r.data)).catch(() => {});
    posts.list({ brand_id: brandId }).then((r) => setRecentPosts(r.data?.slice(0, 5) || [])).catch(() => {});
    campaignsApi.list(brandId).then((r) => setCampaignList(r.data?.slice(0, 4) || [])).catch(() => {});
    alertsApi.list(brandId, false).then((r) => setAlertList(r.data?.slice(0, 3) || [])).catch(() => {});
  }, [user]);

  const stats = [
    { label: "Total Posts", value: overview?.total_posts || 0, icon: FileText, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Engagement Rate", value: `${overview?.engagement_rate || 0}%`, icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Followers", value: overview?.total_followers?.toLocaleString() || "0", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Reach Growth", value: `+${overview?.reach_growth || 0}%`, icon: BarChart3, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const quickActions = [
    { to: "/content/create", icon: PenTool, label: "AI Text Gen", desc: "Claude + GPT-4o + Gemini", color: "from-orange-600 to-amber-600" },
    { to: "/media", icon: Image, label: "Media Gen", desc: "Nano Banana + Veo3", color: "from-blue-600 to-cyan-600" },
    { to: "/campaigns", icon: Megaphone, label: "New Campaign", desc: "AI-powered ideation", color: "from-purple-600 to-pink-600" },
    { to: "/calendar", icon: Calendar, label: "Schedule", desc: "Auto-schedule posts", color: "from-emerald-600 to-teal-600" },
  ];

  const alertIcons = { underperform: AlertTriangle, boost: Zap, trend: TrendingUp, sentiment: MessageCircle };
  const alertColors = { underperform: "text-rose-400", boost: "text-emerald-400", trend: "text-blue-400", sentiment: "text-amber-400" };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">
            Welcome back, <span className="text-orange-400">{user?.name?.split(" ")[0] || "there"}</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Your social media command center</p>
        </div>
        <Link to="/content/create">
          <Button data-testid="create-content-btn" className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4 mr-2" /> Create Content
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, '-')}`} className="card-grid-border p-4 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
            </div>
            <p className="text-xl font-bold font-[Outfit] tracking-tight text-white">{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.to} data-testid={`quick-action-${a.label.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="card-grid-border p-4 group hover:border-zinc-600 transition-all cursor-pointer">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <a.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-zinc-200 font-[Outfit]">{a.label}</p>
              <p className="text-[10px] text-zinc-500">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Posts */}
        <div className="card-grid-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-400 font-[Outfit] uppercase tracking-wider">Recent Posts</h3>
            <Link to="/content/create" className="text-[10px] text-orange-400 hover:text-orange-300">+ New</Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-6 h-6 text-zinc-700 mx-auto mb-1.5" />
              <p className="text-zinc-600 text-xs">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPosts.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-md bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.status === "published" ? "#10b981" : p.status === "scheduled" ? "#3b82f6" : "#52525b" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{p.caption || "Untitled"}</p>
                    <p className="text-[10px] text-zinc-600">{p.platforms?.join(", ") || ""}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 capitalize shrink-0">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Campaigns */}
        <div className="card-grid-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-400 font-[Outfit] uppercase tracking-wider">Campaigns</h3>
            <Link to="/campaigns" className="text-[10px] text-orange-400 hover:text-orange-300">View all</Link>
          </div>
          {campaignList.length === 0 ? (
            <div className="text-center py-6">
              <Megaphone className="w-6 h-6 text-zinc-700 mx-auto mb-1.5" />
              <p className="text-zinc-600 text-xs">No campaigns</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campaignList.map((c) => (
                <Link key={c.id} to={`/campaigns/${c.id}`}>
                  <div className="flex items-center gap-2.5 p-2 rounded-md bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                    <Megaphone className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{c.name}</p>
                      <p className="text-[10px] text-zinc-600">{c.post_count || 0} posts · {c.goal}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 capitalize">{c.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card-grid-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-400 font-[Outfit] uppercase tracking-wider">Active Alerts</h3>
            <Link to="/alerts" className="text-[10px] text-orange-400 hover:text-orange-300">View all</Link>
          </div>
          {alertList.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-6 h-6 text-zinc-700 mx-auto mb-1.5" />
              <p className="text-zinc-600 text-xs">All clear</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertList.map((a, i) => {
                const Icon = alertIcons[a.type] || Bell;
                return (
                  <div key={a.id || i} className="flex items-start gap-2.5 p-2 rounded-md bg-zinc-900/30">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${alertColors[a.type] || "text-zinc-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 line-clamp-2">{a.message}</p>
                      <p className="text-[10px] text-zinc-600 capitalize">{a.type} · {a.severity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
