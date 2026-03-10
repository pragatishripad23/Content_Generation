import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { sentiment } from "@/lib/api";
import { MessageCircle, Loader2, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const sentimentColors = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  negative: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  neutral: "bg-zinc-800 text-zinc-400 border-zinc-700",
};

export default function SentimentPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [input, setInput] = useState("");
  const brandId = user?.brand?.id;

  useEffect(() => {
    sentiment.list(brandId).then((r) => setLogs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [brandId]);

  const handleAnalyze = async () => {
    const comments = input.split("\n").filter((c) => c.trim());
    if (!comments.length) { toast.error("Enter comments to analyze"); return; }
    setAnalyzing(true);
    try {
      const r = await sentiment.analyze({ comments, platform: "general" });
      setLogs((prev) => [...(r.data.results || []), ...prev]);
      setInput("");
      toast.success(`Analyzed ${comments.length} comments`);
    } catch { toast.error("Analysis failed"); } finally { setAnalyzing(false); }
  };

  const summary = {
    positive: logs.filter((l) => l.sentiment === "positive").length,
    negative: logs.filter((l) => l.sentiment === "negative").length,
    neutral: logs.filter((l) => l.sentiment === "neutral").length,
  };
  const total = logs.length || 1;
  const avgScore = logs.length ? Math.round(logs.reduce((a, l) => a + (l.score || 50), 0) / logs.length) : 0;

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="sentiment-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Sentiment Analysis</h1>
        <p className="text-zinc-500 mt-1 text-sm">AI-powered comment classification and sentiment tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card-grid-border p-4 text-center">
          <p className="text-2xl font-bold text-white font-[Outfit]">{logs.length}</p>
          <p className="text-xs text-zinc-500">Total Analyzed</p>
        </div>
        <div className="card-grid-border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400 font-[Outfit]">{Math.round(summary.positive / total * 100)}%</p>
          <p className="text-xs text-zinc-500">Positive</p>
        </div>
        <div className="card-grid-border p-4 text-center">
          <p className="text-2xl font-bold text-rose-400 font-[Outfit]">{Math.round(summary.negative / total * 100)}%</p>
          <p className="text-xs text-zinc-500">Negative</p>
        </div>
        <div className="card-grid-border p-4 text-center">
          <p className="text-2xl font-bold text-orange-400 font-[Outfit]">{avgScore}</p>
          <p className="text-xs text-zinc-500">Avg Score</p>
        </div>
      </div>

      {/* Input */}
      <div className="card-grid-border p-5 mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" /> Analyze Comments
        </h3>
        <Textarea
          data-testid="sentiment-input"
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Paste comments here (one per line)..."
          rows={4} className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none mb-3"
        />
        <Button data-testid="analyze-sentiment-btn" onClick={handleAnalyze} disabled={analyzing} className="bg-orange-600 hover:bg-orange-500 text-white">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Analyze Sentiment
        </Button>
      </div>

      {/* Results */}
      {logs.length > 0 && (
        <div className="card-grid-border p-5">
          <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4">Results ({logs.length})</h3>
          <div className="space-y-2">
            {logs.slice(0, 30).map((l, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-zinc-900/40">
                <MessageCircle className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{l.text || l.comment_text}</p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${sentimentColors[l.sentiment] || sentimentColors.neutral}`}>
                  {l.sentiment} {l.score}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
