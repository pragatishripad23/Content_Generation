import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { analytics } from "@/lib/api";
import { BarChart3, TrendingUp, Eye, MousePointer, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const chartColors = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"];
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-zinc-900/95 border border-zinc-800 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}</p>)}
    </div>
  );
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const brandId = user?.brand?.id;

  const load = async () => {
    setLoading(true);
    try {
      const [o, m] = await Promise.all([analytics.overview(brandId), analytics.platformMetrics(days)]);
      setOverview(o.data);
      setMetrics(m.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (brandId) load(); }, [brandId, days]); // eslint-disable-line

  const engagementData = metrics.map((m) => ({
    date: m.date?.substring(5),
    Instagram: m.instagram?.engagement,
    Twitter: m.twitter?.engagement,
    LinkedIn: m.linkedin?.engagement,
    TikTok: m.tiktok?.engagement,
  }));

  const reachData = metrics.map((m) => ({
    date: m.date?.substring(5),
    Instagram: m.instagram?.reach,
    Twitter: m.twitter?.reach,
    LinkedIn: m.linkedin?.reach,
    TikTok: m.tiktok?.reach,
  }));

  const followerData = metrics.map((m) => ({
    date: m.date?.substring(5),
    Instagram: m.instagram?.followers,
    Twitter: m.twitter?.followers,
    LinkedIn: m.linkedin?.followers,
    TikTok: m.tiktok?.followers,
  }));

  const stats = [
    { label: "Total Posts", value: overview?.total_posts || 0, icon: BarChart3, color: "text-orange-400" },
    { label: "Engagement Rate", value: `${overview?.engagement_rate || 0}%`, icon: TrendingUp, color: "text-blue-400" },
    { label: "Total Reach", value: `+${overview?.reach_growth || 0}%`, icon: Eye, color: "text-emerald-400" },
    { label: "Follower Growth", value: `+${overview?.follower_growth || 0}%`, icon: MousePointer, color: "text-purple-400" },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="analytics-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Analytics</h1>
          <p className="text-zinc-500 mt-1 text-sm">Cross-platform performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800 text-white text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} className="border-zinc-700 text-zinc-300"><RefreshCw className="w-3 h-3 mr-1" />Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card-grid-border p-4">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-xl font-bold font-[Outfit] text-white">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Engagement Rate</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Instagram" stroke="#ea580c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Twitter" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="LinkedIn" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="TikTok" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Reach by Platform</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={reachData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Instagram" stroke="#ea580c" fill="#ea580c" fillOpacity={0.1} />
              <Area type="monotone" dataKey="TikTok" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-grid-border p-5">
        <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Follower Growth</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={followerData.filter((_, i) => i % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Instagram" fill="#ea580c" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Twitter" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="LinkedIn" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="TikTok" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
