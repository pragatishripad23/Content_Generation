import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { campaigns as campaignsApi } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Megaphone, Calendar, Target, Loader2, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CampaignsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", brief: "", goal: "awareness", start_date: "", end_date: "",
  });

  const brandId = user?.brand?.id;

  const load = async () => {
    if (!brandId) return;
    try {
      const res = await campaignsApi.list(brandId);
      setCampaigns(res.data || []);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [brandId]); // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.brief) { toast.error("Name and brief are required"); return; }
    setCreating(true);
    try {
      const res = await campaignsApi.create({ ...form, brand_id: brandId });
      toast.success("Campaign created");
      setDialogOpen(false);
      setForm({ name: "", brief: "", goal: "awareness", start_date: "", end_date: "" });
      navigate(`/campaigns/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await campaignsApi.delete(id);
      toast.success("Campaign deleted");
      load();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const goalColors = {
    awareness: "bg-blue-500/10 text-blue-400",
    engagement: "bg-emerald-500/10 text-emerald-400",
    conversion: "bg-orange-500/10 text-orange-400",
    traffic: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="campaigns-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Campaigns</h1>
          <p className="text-zinc-500 mt-1 text-sm">Manage your marketing campaigns and content calendars</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-campaign-btn" className="bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20">
              <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-[Outfit] text-xl">Create Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Campaign Name</Label>
                <Input
                  data-testid="campaign-name-input" value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Summer Product Launch" required
                  className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Brief</Label>
                <Textarea
                  data-testid="campaign-brief-input" value={form.brief}
                  onChange={(e) => setForm((p) => ({ ...p, brief: e.target.value }))}
                  placeholder="Describe your campaign goals, target audience, and key messages..."
                  required rows={3}
                  className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Goal</Label>
                  <Select value={form.goal} onValueChange={(v) => setForm((p) => ({ ...p, goal: v }))}>
                    <SelectTrigger data-testid="campaign-goal-select" className="bg-zinc-950/50 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="awareness">Awareness</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="conversion">Conversion</SelectItem>
                      <SelectItem value="traffic">Traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Start</Label>
                  <Input
                    type="date" data-testid="campaign-start-input" value={form.start_date}
                    onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">End</Label>
                  <Input
                    type="date" data-testid="campaign-end-input" value={form.end_date}
                    onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                    className="bg-zinc-950/50 border-zinc-800 text-white"
                  />
                </div>
              </div>
              <Button
                type="submit" data-testid="submit-campaign-btn" disabled={creating}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11 mt-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Campaign"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card-grid-border p-12 text-center">
          <Megaphone className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-300 font-[Outfit] mb-1">No campaigns yet</h3>
          <p className="text-zinc-500 text-sm mb-4">Create your first campaign to start generating content with AI</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map((c, i) => (
            <div
              key={c.id}
              data-testid={`campaign-card-${i}`}
              className="card-grid-border p-5 animate-fade-in group"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <Link to={`/campaigns/${c.id}`} className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-zinc-100 font-[Outfit] truncate group-hover:text-orange-400 transition-colors">
                    {c.name}
                  </h3>
                </Link>
                <button
                  data-testid={`delete-campaign-${i}`}
                  onClick={() => handleDelete(c.id)}
                  className="text-zinc-600 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4">{c.brief}</p>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${goalColors[c.goal] || "bg-zinc-800 text-zinc-400"}`}>
                  <Target className="w-3 h-3 inline mr-1" />{c.goal}
                </span>
                <span className="text-xs text-zinc-600">
                  <Calendar className="w-3 h-3 inline mr-1" />{c.start_date || "No date"}
                </span>
                <span className="text-xs text-zinc-600 ml-auto">{c.post_count || 0} posts</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
