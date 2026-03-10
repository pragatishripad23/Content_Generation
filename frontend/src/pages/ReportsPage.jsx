import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { reports } from "@/lib/api";
import { FileText, Loader2, Sparkles, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    reports.list(user?.brand?.id).then((r) => setData(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await reports.generate({});
      setData((prev) => [r.data, ...prev]);
      toast.success("Weekly report generated!");
    } catch { toast.error("Failed to generate report"); } finally { setGenerating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="reports-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Weekly AI Reports</h1>
          <p className="text-zinc-500 mt-1 text-sm">AI-generated performance reports with insights and recommendations</p>
        </div>
        <Button data-testid="generate-report-btn" onClick={handleGenerate} disabled={generating} className="bg-orange-600 hover:bg-orange-500 text-white">
          {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Report
        </Button>
      </div>

      {data.length === 0 ? (
        <div className="card-grid-border p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-zinc-400 font-[Outfit] mb-1">No reports yet</h3>
          <p className="text-zinc-600 text-sm mb-4">Generate your first weekly AI report</p>
          <Button onClick={handleGenerate} disabled={generating} className="bg-orange-600 hover:bg-orange-500 text-white">
            <Sparkles className="w-4 h-4 mr-2" /> Generate Now
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((r, i) => {
            const s = r.summary_json || {};
            return (
              <div key={r.id || i} data-testid={`report-card-${i}`} className="card-grid-border p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white font-[Outfit]">Weekly Report</h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Week of {r.week_start}</p>
                    </div>
                  </div>
                </div>

                {s.summary && <p className="text-sm text-zinc-300 leading-relaxed mb-4 bg-zinc-900/50 rounded-lg p-4">{s.summary}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {s.highlights && s.highlights.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 mb-2">Highlights</h4>
                      <ul className="space-y-1">{s.highlights.map((h, j) => <li key={j} className="text-xs text-zinc-300 flex items-start gap-2"><span className="text-orange-400 mt-0.5">*</span>{h}</li>)}</ul>
                    </div>
                  )}
                  {s.recommendations && s.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-400 mb-2">Recommendations</h4>
                      <ul className="space-y-1">{s.recommendations.map((h, j) => <li key={j} className="text-xs text-zinc-300 flex items-start gap-2"><span className="text-emerald-400 mt-0.5">*</span>{h}</li>)}</ul>
                    </div>
                  )}
                  {s.next_week_plan && s.next_week_plan.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-semibold text-zinc-400 mb-2">Next Week Plan</h4>
                      <ul className="space-y-1">{s.next_week_plan.map((h, j) => <li key={j} className="text-xs text-zinc-300 flex items-start gap-2"><span className="text-blue-400 mt-0.5">*</span>{h}</li>)}</ul>
                    </div>
                  )}
                </div>

                {r.recommendations && r.recommendations.length > 0 && !s.recommendations && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-zinc-400 mb-2">Key Recommendations</h4>
                    <div className="flex flex-wrap gap-2">{r.recommendations.map((rec, j) => <span key={j} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">{rec}</span>)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
