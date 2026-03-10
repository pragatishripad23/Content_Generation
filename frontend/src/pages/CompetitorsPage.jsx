import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { competitors } from "@/lib/api";
import { Users, TrendingUp, BarChart3, Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CompetitorsPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", handle: "" });
  const brandId = user?.brand?.id;

  const load = async () => {
    try { const r = await competitors.list(brandId); setData(r.data || []); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { if (brandId) load(); }, [brandId]); // eslint-disable-line

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await competitors.add(form, brandId); toast.success("Competitor added"); setDialogOpen(false); load(); } catch { toast.error("Failed"); }
  };
  const handleDelete = async (id) => { await competitors.delete(id); toast.success("Removed"); load(); };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="competitors-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Competitor Tracker</h1>
          <p className="text-zinc-500 mt-1 text-sm">Monitor competitor performance and benchmark against them</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-500 text-white"><Plus className="w-4 h-4 mr-2" /> Add Competitor</Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader><DialogTitle className="font-[Outfit]">Add Competitor</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                  <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Handle</Label>
                <Input value={form.handle} onChange={(e) => setForm((p) => ({ ...p, handle: e.target.value }))} placeholder="@competitor" className="bg-zinc-950/50 border-zinc-800 text-white" />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white">Add</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map((c, i) => (
          <div key={c.id || i} data-testid={`competitor-card-${i}`} className="card-grid-border p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-300">{c.handle?.charAt(1)?.toUpperCase() || "?"}</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{c.handle}</p>
                  <p className="text-xs text-zinc-500 capitalize">{c.platform}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 rounded-md p-3">
                <p className="text-xs text-zinc-500 mb-1"><BarChart3 className="w-3 h-3 inline mr-1" />Posts/Week</p>
                <p className="text-lg font-bold text-white font-[Outfit]">{c.post_count_week}</p>
              </div>
              <div className="bg-zinc-900/50 rounded-md p-3">
                <p className="text-xs text-zinc-500 mb-1"><TrendingUp className="w-3 h-3 inline mr-1" />Engagement</p>
                <p className="text-lg font-bold text-white font-[Outfit]">{c.avg_engagement}%</p>
              </div>
              <div className="bg-zinc-900/50 rounded-md p-3">
                <p className="text-xs text-zinc-500 mb-1"><Users className="w-3 h-3 inline mr-1" />Growth</p>
                <p className={`text-lg font-bold font-[Outfit] ${c.follower_growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{c.follower_growth > 0 ? "+" : ""}{c.follower_growth}%</p>
              </div>
              <div className="bg-zinc-900/50 rounded-md p-3">
                <p className="text-xs text-zinc-500 mb-1">Top Post</p>
                {c.top_post_url ? <a href={c.top_post_url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline flex items-center gap-1">View <ExternalLink className="w-2.5 h-2.5" /></a> : <span className="text-xs text-zinc-600">N/A</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
