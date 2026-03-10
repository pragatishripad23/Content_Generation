import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { generate, posts as postsApi } from "@/lib/api";
import {
  Sparkles, Loader2, Copy, Check, Hash, Wand2, RefreshCw,
  Zap, Brain, Cpu, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const modelIcons = { "claude-sonnet": Brain, "gpt-4o": Zap, "gemini": Cpu };
const modelColors = {
  "claude-sonnet": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "gpt-4o": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "gemini": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
};

export default function ContentCreatorPage() {
  const { user } = useAuth();
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [copied, setCopied] = useState(null);

  // Caption variations state (Module 3)
  const [genVariations, setGenVariations] = useState(false);
  const [captionVariations, setCaptionVariations] = useState([]);
  const [showVariations, setShowVariations] = useState(false);

  // ─── Module 2: Multi-Model Text Generation ───
  const handleGenerate = async () => {
    if (!brief.trim()) { toast.error("Enter a brief or topic first"); return; }
    setGenerating(true);
    setVariations([]);
    setSelectedModel(null);
    setCaptionVariations([]);
    setShowVariations(false);
    try {
      const res = await generate.text({
        brief, platform, tone,
        brand_voice: user?.brand?.voice,
        brand_keywords: user?.brand?.keywords || [],
      });
      setVariations(res.data.variations || []);
      toast.success("Generated content from 3 AI models!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = (model) => {
    setSelectedModel(model);
    setCaptionVariations([]);
    setShowVariations(false);
    toast.success(`Selected ${model} output`);
  };

  // ─── Module 3: Caption Variations ───
  const handleGenerateVariations = async () => {
    const selected = variations.find((v) => v.model === selectedModel);
    if (!selected) { toast.error("Select a model output first"); return; }
    setGenVariations(true);
    try {
      const res = await generate.variations({ caption: selected.caption, count: 6 });
      setCaptionVariations(res.data.variations || []);
      setShowVariations(true);
      toast.success("Caption variations generated!");
    } catch (err) {
      toast.error("Failed to generate variations");
    } finally {
      setGenVariations(false);
    }
  };

  // Save as post
  const handleSavePost = async (caption) => {
    try {
      await postsApi.create({
        brand_id: user?.brand?.id,
        caption,
        platforms: [platform],
        post_type: "text",
      });
      toast.success("Post saved as draft!");
    } catch {
      toast.error("Failed to save post");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 text-amber-400";
    return "bg-zinc-800 text-zinc-400";
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="content-creator-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Content Creator</h1>
        <p className="text-zinc-500 mt-1 text-sm">Generate social media content using Claude, GPT-4o & Gemini simultaneously</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Input Panel */}
        <div className="lg:col-span-1">
          <div className="card-grid-border p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-orange-400" /> Generation Settings
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Brief / Topic</Label>
                <Textarea
                  data-testid="content-brief-input"
                  value={brief} onChange={(e) => setBrief(e.target.value)}
                  placeholder="Describe what you want to post about..."
                  rows={4}
                  className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger data-testid="platform-select" className="bg-zinc-950/50 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter / X</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="tone-select" className="bg-zinc-950/50 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="inspiring">Inspiring</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="bold">Bold & Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                data-testid="generate-text-btn"
                onClick={handleGenerate} disabled={generating}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 h-11"
              >
                {generating ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating...</span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generate with 3 Models</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right — Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {generating && (
            <div className="card-grid-border p-8 text-center animate-pulse-glow">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
              <p className="text-zinc-300 font-[Outfit] font-semibold">Generating with 3 AI models...</p>
              <p className="text-zinc-500 text-sm mt-1">Claude Sonnet, GPT-4o, and Gemini are working in parallel</p>
            </div>
          )}

          {!generating && variations.length === 0 && (
            <div className="card-grid-border p-12 text-center">
              <Sparkles className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-zinc-400 font-[Outfit] mb-1">Ready to create</h3>
              <p className="text-zinc-600 text-sm">Enter your brief and click generate to compare outputs from 3 AI models</p>
            </div>
          )}

          {/* Model comparison cards — Module 2 */}
          {variations.length > 0 && (
            <div data-testid="model-results">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-3">
                Model Comparison ({variations.length} results)
              </h3>
              <div className="space-y-3">
                {variations.map((v, i) => {
                  const Icon = modelIcons[v.model] || Sparkles;
                  const colors = modelColors[v.model] || { bg: "bg-zinc-800", text: "text-zinc-400", border: "border-zinc-700" };
                  const isSelected = selectedModel === v.model;

                  return (
                    <div
                      key={i}
                      data-testid={`model-card-${v.model}`}
                      className={`model-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md ${colors.bg} flex items-center justify-center`}>
                            <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                          </div>
                          <span className="text-sm font-semibold text-zinc-200 capitalize">{v.model}</span>
                          {isSelected && <Badge className="bg-orange-500/15 text-orange-400 border-none text-[10px]">Selected</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`score-badge ${getScoreColor(v.score)}`}>
                            {v.score}/100
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-300 leading-relaxed mb-3 whitespace-pre-wrap">{v.caption}</p>

                      {v.hashtags && v.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {v.hashtags.map((h, j) => (
                            <span key={j} className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                              <Hash className="w-2.5 h-2.5 inline mr-0.5" />{h.replace("#", "")}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm" variant="outline"
                          data-testid={`select-${v.model}-btn`}
                          onClick={() => handleSelect(v.model)}
                          className={`text-xs h-8 ${isSelected ? "border-orange-500 text-orange-400" : "border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
                        >
                          {isSelected ? <Check className="w-3 h-3 mr-1" /> : null}
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleCopy(v.caption, i)}
                          className="text-xs h-8 text-zinc-500 hover:text-white"
                        >
                          {copied === i ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                          Copy
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => handleSavePost(v.caption)}
                          className="text-xs h-8 text-zinc-500 hover:text-white"
                        >
                          Save as Draft
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Module 3: Caption Variations */}
          {selectedModel && (
            <div className="card-grid-border p-5 animate-fade-in" data-testid="caption-variations-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit]">Caption Variations</h3>
                    <p className="text-xs text-zinc-500">Generate 6 style variations from the selected output</p>
                  </div>
                </div>
                <Button
                  data-testid="generate-variations-btn"
                  onClick={handleGenerateVariations}
                  disabled={genVariations}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs h-8"
                >
                  {genVariations ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Generate Variations
                </Button>
              </div>

              {showVariations && captionVariations.length > 0 && (
                <div className="space-y-3" data-testid="variations-list">
                  {captionVariations.map((cv, i) => (
                    <div key={i} data-testid={`variation-card-${i}`} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-zinc-800 text-zinc-300 border-none text-[10px]">
                          {cv.variation_type || cv.type || `Style ${i + 1}`}
                        </Badge>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleCopy(cv.caption, `var-${i}`)}
                            className="text-zinc-600 hover:text-white transition-colors p-1"
                          >
                            {copied === `var-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => handleSavePost(cv.caption)}
                            className="text-xs text-zinc-600 hover:text-orange-400 transition-colors px-2"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{cv.caption}</p>
                      {cv.hashtags && cv.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cv.hashtags.map((h, j) => (
                            <span key={j} className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                              #{typeof h === "string" ? h.replace("#", "") : h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
