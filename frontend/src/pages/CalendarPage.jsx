import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { schedules, posts as postsApi } from "@/lib/api";
import { Calendar as CalIcon, Clock, Plus, Trash2, Loader2, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

export default function CalendarPage() {
  const { user } = useAuth();
  const [scheds, setScheds] = useState([]);
  const [postsList, setPostsList] = useState([]);
  const [optTimes, setOptTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ post_id: "", scheduled_at: "", timezone: "UTC" });
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const brandId = user?.brand?.id;

  const load = async () => {
    if (!brandId) return;
    try {
      const [s, p, o] = await Promise.all([
        schedules.list(brandId), postsApi.list({ brand_id: brandId }),
        schedules.optimalTimes(brandId),
      ]);
      setScheds(s.data || []);
      setPostsList(p.data || []);
      setOptTimes(o.data || {});
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [brandId]); // eslint-disable-line

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!form.post_id || !form.scheduled_at) { toast.error("Select post and time"); return; }
    try {
      await schedules.create(form);
      toast.success("Post scheduled!");
      setDialogOpen(false);
      load();
    } catch { toast.error("Failed to schedule"); }
  };

  const handleDelete = async (id) => {
    await schedules.delete(id);
    toast.success("Schedule removed");
    load();
  };

  // Auto-schedule functionality
  const handleAutoSchedule = async (enabled) => {
    setAutoSchedule(enabled);
    if (enabled) {
      setAutoScheduling(true);
      const draftPosts = postsList.filter(p => p.status === "draft" && !scheds.some(s => s.post_id === p.id));
      
      if (draftPosts.length === 0) {
        toast.info("No draft posts to schedule");
        setAutoSchedule(false);
        setAutoScheduling(false);
        return;
      }

      // Get optimal times for the primary platform
      const platformTimes = Object.entries(optTimes);
      const today = new Date();
      let scheduledCount = 0;

      for (let i = 0; i < draftPosts.length; i++) {
        const post = draftPosts[i];
        const platform = post.platforms?.[0] || "instagram";
        const times = optTimes[platform] || ["09:00", "12:00", "18:00"];
        const timeSlot = times[i % times.length];
        
        // Schedule for the next available day
        const scheduleDate = new Date(today);
        scheduleDate.setDate(today.getDate() + i + 1);
        const [hours, mins] = timeSlot.split(":");
        scheduleDate.setHours(parseInt(hours), parseInt(mins), 0, 0);
        
        try {
          await schedules.create({
            post_id: post.id,
            scheduled_at: scheduleDate.toISOString().slice(0, 16),
            timezone: "UTC"
          });
          scheduledCount++;
        } catch (err) {
          console.error("Failed to schedule post:", err);
        }
      }

      toast.success(`Auto-scheduled ${scheduledCount} posts at optimal times!`);
      setAutoScheduling(false);
      load();
    } else {
      toast.info("Auto-schedule disabled");
    }
  };

  // Build calendar grid for current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const getSchedulesForDay = (date) => {
    const ds = date.toISOString().split("T")[0];
    return scheds.filter((s) => s.scheduled_at?.startsWith(ds));
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="calendar-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Content Calendar</h1>
          <p className="text-zinc-500 mt-1 text-sm">Schedule and manage your social media posts</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-Schedule Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">Auto-Schedule</span>
            <Switch 
              checked={autoSchedule} 
              onCheckedChange={handleAutoSchedule}
              disabled={autoScheduling}
              className="data-[state=checked]:bg-orange-600"
            />
            {autoScheduling && <Loader2 className="w-3 h-3 animate-spin text-orange-500" />}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="schedule-post-btn" className="bg-orange-600 hover:bg-orange-500 text-white"><Plus className="w-4 h-4 mr-2" /> Schedule Post</Button>
            </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader><DialogTitle className="font-[Outfit]">Schedule a Post</DialogTitle></DialogHeader>
            <form onSubmit={handleSchedule} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Select Post</Label>
                <Select value={form.post_id} onValueChange={(v) => setForm((p) => ({ ...p, post_id: v }))}>
                  <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue placeholder="Choose a post..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 max-h-48">
                    {postsList.filter((p) => p.status === "draft").map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.caption?.substring(0, 50) || "Untitled"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Date & Time</Label>
                <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} className="bg-zinc-950/50 border-zinc-800 text-white" />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white">Schedule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Optimal Times */}
      <div className="card-grid-border p-4 mb-6">
        <h3 className="text-xs font-semibold text-zinc-400 font-[Outfit] mb-3 flex items-center gap-2"><Zap className="w-3 h-3 text-amber-400" /> Optimal Posting Times</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(optTimes).map(([platform, times]) => (
            <div key={platform} className="text-xs">
              <span className="text-zinc-500 capitalize">{platform}:</span>{" "}
              {(times || []).map((t, i) => <Badge key={i} variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] mx-0.5">{t}</Badge>)}
            </div>
          ))}
        </div>
      </div>

      {/* Week Grid */}
      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div> : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, di) => {
            const dayScheds = getSchedulesForDay(day);
            const isToday = day.toDateString() === today.toDateString();
            return (
              <div key={di} className={`card-grid-border p-3 min-h-[160px] ${isToday ? "border-orange-500/30" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${isToday ? "text-orange-400" : "text-zinc-500"}`}>{DAYS[day.getDay()]}</span>
                  <span className={`text-xs ${isToday ? "text-orange-400 font-bold" : "text-zinc-600"}`}>{day.getDate()}</span>
                </div>
                <div className="space-y-1.5">
                  {dayScheds.map((s) => (
                    <div key={s.id} className="bg-zinc-800/60 rounded p-1.5 text-[10px] group">
                      <div className="flex items-center justify-between">
                        <span className="text-orange-400"><Clock className="w-2.5 h-2.5 inline mr-0.5" />{s.scheduled_at?.split("T")[1]?.substring(0, 5)}</span>
                        <button onClick={() => handleDelete(s.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400"><Trash2 className="w-2.5 h-2.5" /></button>
                      </div>
                      <p className="text-zinc-400 truncate mt-0.5">{s.post?.caption?.substring(0, 30) || "Post"}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduled list */}
      {scheds.length > 0 && (
        <div className="card-grid-border p-5 mt-6">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3">All Scheduled ({scheds.length})</h3>
          <div className="space-y-2">
            {scheds.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/40">
                <CalIcon className="w-4 h-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{s.post?.caption?.substring(0, 60) || "Untitled"}</p>
                  <p className="text-xs text-zinc-500">{s.scheduled_at} · {s.status}</p>
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
