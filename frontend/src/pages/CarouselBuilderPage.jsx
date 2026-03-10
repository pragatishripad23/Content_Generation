import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { generate, posts as postsApi } from "@/lib/api";
import { 
  Layers, Plus, Trash2, Loader2, Sparkles, Download, 
  ChevronLeft, ChevronRight, GripVertical, Image as ImageIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CarouselBuilderPage() {
  const { user } = useAuth();
  const [slides, setSlides] = useState([
    { id: 1, title: "", content: "", imageUrl: null, generating: false }
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [style, setStyle] = useState("modern");

  // Add new slide
  const addSlide = () => {
    const newId = Math.max(...slides.map(s => s.id)) + 1;
    setSlides([...slides, { id: newId, title: "", content: "", imageUrl: null, generating: false }]);
    setActiveSlide(slides.length);
    toast.success("Slide added");
  };

  // Remove slide
  const removeSlide = (index) => {
    if (slides.length <= 1) {
      toast.error("Need at least one slide");
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (activeSlide >= newSlides.length) {
      setActiveSlide(newSlides.length - 1);
    }
    toast.success("Slide removed");
  };

  // Update slide content
  const updateSlide = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  // Generate carousel content with AI
  const generateCarousel = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic for your carousel");
      return;
    }
    setGenerating(true);
    try {
      const res = await generate.text({
        brief: `Create a ${slideCount}-slide Instagram carousel about: ${topic}. 
For each slide, provide a title (max 10 words) and content (2-3 sentences). 
Make it educational and engaging. Format as JSON array with objects containing 'title' and 'content' keys.`,
        platform: "instagram",
        tone: "educational",
        brand_voice: user?.brand?.voice
      });

      // Parse the AI response to get carousel slides
      const variations = res.data.variations || [];
      if (variations.length > 0) {
        const caption = variations[0].caption;
        // Try to parse as JSON
        try {
          let parsed;
          const jsonMatch = caption.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            // Create slides from the caption
            const parts = caption.split(/\d+\.\s*/).filter(Boolean);
            parsed = parts.slice(0, parseInt(slideCount)).map((p, i) => ({
              title: `Slide ${i + 1}`,
              content: p.trim()
            }));
          }
          
          const newSlides = parsed.map((item, i) => ({
            id: i + 1,
            title: item.title || `Slide ${i + 1}`,
            content: item.content || item.text || "",
            imageUrl: null,
            generating: false
          }));
          
          setSlides(newSlides);
          setActiveSlide(0);
          toast.success(`Generated ${newSlides.length} carousel slides!`);
        } catch (e) {
          // Fallback: create slides from text
          const numSlides = parseInt(slideCount);
          const newSlides = Array.from({ length: numSlides }, (_, i) => ({
            id: i + 1,
            title: i === 0 ? topic : `Key Point ${i}`,
            content: i === 0 ? "Swipe to learn more →" : "",
            imageUrl: null,
            generating: false
          }));
          setSlides(newSlides);
          toast.info("Generated carousel structure - customize your content");
        }
      }
    } catch (err) {
      toast.error("Failed to generate carousel content");
    } finally {
      setGenerating(false);
    }
  };

  // Generate image for a specific slide
  const generateSlideImage = async (index) => {
    const slide = slides[index];
    if (!slide.title && !slide.content) {
      toast.error("Add content to this slide first");
      return;
    }
    
    updateSlide(index, "generating", true);
    try {
      const prompt = `Create a clean, ${style} social media carousel slide visual for: "${slide.title}". ${slide.content}. Style: minimalist, Instagram-ready, with space for text overlay.`;
      const res = await generate.image({ 
        prompt, 
        brand_colors: user?.brand?.colors || [],
        style 
      });
      
      if (res.data.success && res.data.image_url) {
        updateSlide(index, "imageUrl", res.data.image_url);
        toast.success("Image generated!");
      } else {
        toast.error(res.data.error || "Failed to generate image");
      }
    } catch {
      toast.error("Image generation failed");
    } finally {
      updateSlide(index, "generating", false);
    }
  };

  // Save carousel as posts
  const saveCarousel = async () => {
    try {
      await postsApi.create({
        brand_id: user?.brand?.id,
        caption: slides.map((s, i) => `[Slide ${i + 1}] ${s.title}\n${s.content}`).join("\n\n"),
        platforms: ["instagram"],
        post_type: "carousel",
        media_urls: slides.filter(s => s.imageUrl).map(s => s.imageUrl)
      });
      toast.success("Carousel saved as draft!");
    } catch {
      toast.error("Failed to save carousel");
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl" data-testid="carousel-builder-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Carousel Builder</h1>
        <p className="text-zinc-500 mt-1 text-sm">Create multi-slide carousel posts with AI assistance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - AI Generation */}
        <div className="lg:col-span-1">
          <div className="card-grid-border p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" /> AI Carousel Generator
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Topic / Theme</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 5 Tips for Better Productivity"
                  rows={3}
                  className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Slides</Label>
                  <Select value={slideCount} onValueChange={setSlideCount}>
                    <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {["3", "5", "7", "10"].map(n => (
                        <SelectItem key={n} value={n}>{n} slides</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {["modern", "minimal", "bold", "elegant", "playful"].map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={generateCarousel} 
                disabled={generating}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white h-10"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Carousel</>
                )}
              </Button>
            </div>

            {/* Slide Navigator */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-zinc-400">Slides ({slides.length})</h3>
                <Button size="sm" variant="ghost" onClick={addSlide} className="h-7 text-xs text-orange-400">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {slides.map((slide, i) => (
                  <div 
                    key={slide.id}
                    onClick={() => setActiveSlide(i)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeSlide === i 
                        ? "bg-orange-500/10 border border-orange-500/30" 
                        : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <GripVertical className="w-3 h-3 text-zinc-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{slide.title || `Slide ${i + 1}`}</p>
                    </div>
                    {slide.imageUrl && <ImageIcon className="w-3 h-3 text-emerald-400" />}
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSlide(i); }}
                      className="text-zinc-600 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={saveCarousel}
              variant="outline"
              className="w-full mt-4 border-zinc-700 text-zinc-300 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Save as Draft
            </Button>
          </div>
        </div>

        {/* Right Panel - Slide Editor */}
        <div className="lg:col-span-2">
          <div className="card-grid-border p-6">
            {/* Slide Preview Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> 
                Slide {activeSlide + 1} of {slides.length}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                  disabled={activeSlide === 0}
                  className="h-8 w-8 p-0 border-zinc-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                  disabled={activeSlide === slides.length - 1}
                  className="h-8 w-8 p-0 border-zinc-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Slide Editor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content Editor */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Slide Title</Label>
                  <Input
                    value={slides[activeSlide]?.title || ""}
                    onChange={(e) => updateSlide(activeSlide, "title", e.target.value)}
                    placeholder="Enter slide title..."
                    className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Content</Label>
                  <Textarea
                    value={slides[activeSlide]?.content || ""}
                    onChange={(e) => updateSlide(activeSlide, "content", e.target.value)}
                    placeholder="Enter slide content..."
                    rows={6}
                    className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none"
                  />
                </div>
                <Button
                  onClick={() => generateSlideImage(activeSlide)}
                  disabled={slides[activeSlide]?.generating}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {slides[activeSlide]?.generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
                  ) : (
                    <><ImageIcon className="w-4 h-4 mr-2" /> Generate Image</>
                  )}
                </Button>
              </div>

              {/* Image Preview */}
              <div className="aspect-square bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden">
                {slides[activeSlide]?.generating ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Generating image...</p>
                  </div>
                ) : slides[activeSlide]?.imageUrl ? (
                  <img 
                    src={slides[activeSlide].imageUrl} 
                    alt={`Slide ${activeSlide + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-xs text-zinc-500">Click "Generate Image" to create a visual for this slide</p>
                  </div>
                )}
              </div>
            </div>

            {/* Slide Thumbnails */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {slides.map((slide, i) => (
                  <div
                    key={slide.id}
                    onClick={() => setActiveSlide(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg border cursor-pointer transition-all ${
                      activeSlide === i
                        ? "border-orange-500 ring-2 ring-orange-500/20"
                        : "border-zinc-800 hover:border-zinc-600"
                    } ${slide.imageUrl ? "" : "bg-zinc-900/50"} overflow-hidden`}
                  >
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-zinc-500">{i + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
