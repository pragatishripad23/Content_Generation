import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { audience } from "@/lib/api";
import { Users, MapPin, Clock, Heart, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e"];
const HOUR_LABELS = { 0: "12a", 3: "3a", 6: "6a", 9: "9a", 12: "12p", 15: "3p", 18: "6p", 21: "9p" };

export default function AudiencePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [hours, setHours] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([audience.insights(user?.brand?.id), audience.activeHours()])
      .then(([i, h]) => { setData(i.data); setHours(h.data || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  const ageData = data?.age_range ? Object.entries(data.age_range).map(([k, v]) => ({ name: k, value: v })) : [];
  const genderData = data?.gender ? Object.entries(data.gender).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="audience-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Audience Insights</h1>
        <p className="text-zinc-500 mt-1 text-sm">Demographics, behavior patterns, and active hours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Age */}
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-orange-400" /> Age Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender */}
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Gender Split</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {genderData.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm text-zinc-300 capitalize">{g.name}: {g.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Hours Heatmap */}
      <div className="card-grid-border p-5 mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> Active Hours Heatmap</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex mb-1">
              <div className="w-20 shrink-0" />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-zinc-600">{HOUR_LABELS[h] || ""}</div>
              ))}
            </div>
            {Object.entries(hours).map(([day, activeHours]) => (
              <div key={day} className="flex items-center mb-1">
                <div className="w-20 shrink-0 text-xs text-zinc-500 capitalize">{day}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const isActive = (activeHours || []).includes(h);
                  return (
                    <div key={h} className="flex-1 px-0.5">
                      <div className={`h-6 rounded-sm transition-colors ${isActive ? "bg-orange-500/70 hover:bg-orange-500" : "bg-zinc-900 hover:bg-zinc-800"}`} title={`${day} ${h}:00 - ${isActive ? "Active" : "Low"}`} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500"><div className="w-3 h-3 rounded-sm bg-orange-500/70" /> Active</div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500"><div className="w-3 h-3 rounded-sm bg-zinc-900" /> Low Activity</div>
        </div>
      </div>

      {/* Top Locations & Interests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Top Locations</h3>
          <div className="space-y-2">
            {(data?.top_locations || []).map((loc, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-5">{i + 1}.</span>
                <span className="text-sm text-zinc-300">{loc}</span>
                <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${100 - i * 18}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Interests</h3>
          <div className="flex flex-wrap gap-2">
            {(data?.interests || []).map((int, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">{int}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
