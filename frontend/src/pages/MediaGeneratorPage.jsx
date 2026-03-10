import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { generate, posts as postsApi } from "@/lib/api";
import { Image as ImageIcon, Video, Loader2, Download, Check, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function MediaGeneratorPage() {
  const { user } = useAuth();

  // Image state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgStyle, setImgStyle] = useState("modern");
  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  // Video state
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidDuration, setVidDuration] = useState("8s");
  const [vidAspect, setVidAspect] = useState("16:9");
  const [generatingVid, setGeneratingVid] = useState(false);
  const [videoResult, setVideoResult] = useState(null);
  const [videoRequestId, setVideoRequestId] = useState(null);
  const [polling, setPolling] = useState(false);

  // Module 4: AI Image Generation
  const handleGenerateImage = async () => {
    if (!imgPrompt.trim()) { toast.error("Enter an image prompt"); return; }
    setGeneratingImg(true);
    setGeneratedImage(null);
    try {
      const r = await generate.image({ prompt: imgPrompt, brand_colors: user?.brand?.colors || [], style: imgStyle, count: 1 });
      if (r.data.success) {
        setGeneratedImage(r.data);
        toast.success("Image generated!");
      } else {
        toast.error(r.data.error || "Image generation failed");
      }
    } catch (err) { toast.error("Generation failed"); } finally { setGeneratingImg(false); }
  };

  // Module 5: AI Video Generation
  const handleGenerateVideo = async () => {
    if (!vidPrompt.trim()) { toast.error("Enter a video prompt"); return; }
    setGeneratingVid(true);
    setVideoResult(null);
    setVideoRequestId(null);
    try {
      const r = await generate.video({ prompt: vidPrompt, duration: vidDuration, aspect_ratio: vidAspect });
      if (r.data.success && r.data.request_id) {
        setVideoRequestId(r.data.request_id);
        toast.success("Video generation queued! Polling for result...");
        pollVideoStatus(r.data.request_id);
      } else if (r.data.video_url) {
        setVideoResult(r.data);
        toast.success("Video generated!");
        setGeneratingVid(false);
      } else {
        toast.error(r.data.error || "Video generation failed");
        setGeneratingVid(false);
      }
    } catch { toast.error("Video generation failed"); setGeneratingVid(false); }
  };

  const pollVideoStatus = async (reqId) => {
    setPolling(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const r = await generate.videoResult(reqId);
        if (r.data.success && r.data.video_url) {
          setVideoResult(r.data);
          setPolling(false);
          setGeneratingVid(false);
          clearInterval(interval);
          toast.success("Video ready!");
        }
      } catch {}
      if (attempts > 60) { clearInterval(interval); setPolling(false); setGeneratingVid(false); toast.error("Video generation timed out"); }
    }, 10000);
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl" data-testid="media-generator-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Media Generator</h1>
        <p className="text-zinc-500 mt-1 text-sm">AI-powered image (Nano Banana) and video (Veo3) generation</p>
      </div>

      <Tabs defaultValue="image">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="image" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"><ImageIcon className="w-3 h-3 mr-1.5" />Image Gen</TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Video className="w-3 h-3 mr-1.5" />Video Gen</TabsTrigger>
        </TabsList>

        {/* Image Generation */}
        <TabsContent value="image">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-grid-border p-5">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-orange-400" /> Nano Banana Image</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Image Prompt</Label>
                  <Textarea data-testid="image-prompt-input" value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="A vibrant social media post image for a tech startup launch..." rows={4} className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Style</Label>
                  <Select value={imgStyle} onValueChange={setImgStyle}>
                    <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {["modern", "minimal", "vibrant", "corporate", "artistic", "photorealistic"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button data-testid="generate-image-btn" onClick={handleGenerateImage} disabled={generatingImg} className="w-full bg-orange-600 hover:bg-orange-500 text-white h-11">
                  {generatingImg ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Image</>}
                </Button>
              </div>
            </div>
            <div className="card-grid-border p-5 flex items-center justify-center min-h-[300px]">
              {generatingImg ? (
                <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" /><p className="text-zinc-500 text-sm">Generating with Nano Banana...</p></div>
              ) : generatedImage?.image_url ? (
                <div className="w-full">
                  <img src={generatedImage.image_url} alt="Generated" className="w-full rounded-lg border border-zinc-800" />
                  {generatedImage.text && <p className="text-xs text-zinc-500 mt-2">{generatedImage.text}</p>}
                </div>
              ) : (
                <div className="text-center"><ImageIcon className="w-10 h-10 text-zinc-700 mx-auto mb-2" /><p className="text-zinc-600 text-sm">Generated image will appear here</p></div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Video Generation */}
        <TabsContent value="video">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-grid-border p-5">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit] mb-4 flex items-center gap-2"><Video className="w-4 h-4 text-blue-400" /> Veo3 Video</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Video Prompt</Label>
                  <Textarea data-testid="video-prompt-input" value={vidPrompt} onChange={(e) => setVidPrompt(e.target.value)} placeholder="A dynamic product reveal with camera zoom..." rows={4} className="bg-zinc-950/50 border-zinc-800 focus:border-orange-500 text-white resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Duration</Label>
                    <Select value={vidDuration} onValueChange={setVidDuration}>
                      <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800"><SelectItem value="4s">4 seconds</SelectItem><SelectItem value="6s">6 seconds</SelectItem><SelectItem value="8s">8 seconds</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs">Aspect Ratio</Label>
                    <Select value={vidAspect} onValueChange={setVidAspect}>
                      <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800"><SelectItem value="16:9">16:9 Landscape</SelectItem><SelectItem value="9:16">9:16 Portrait</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <Button data-testid="generate-video-btn" onClick={handleGenerateVideo} disabled={generatingVid} className="w-full bg-blue-600 hover:bg-blue-500 text-white h-11">
                  {generatingVid ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{polling ? "Generating video..." : "Submitting..."}</> : <><Play className="w-4 h-4 mr-2" />Generate Video</>}
                </Button>
              </div>
            </div>
            <div className="card-grid-border p-5 flex items-center justify-center min-h-[300px]">
              {generatingVid ? (
                <div className="text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" /><p className="text-zinc-500 text-sm">Generating with Google Veo3...</p>{videoRequestId && <p className="text-[10px] text-zinc-600 mt-1 font-mono">ID: {videoRequestId}</p>}</div>
              ) : videoResult?.video_url ? (
                <div className="w-full"><video src={videoResult.video_url} controls className="w-full rounded-lg border border-zinc-800" /><a href={videoResult.video_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="mt-3 text-xs border-zinc-700 text-zinc-300"><Download className="w-3 h-3 mr-1" />Download</Button></a></div>
              ) : (
                <div className="text-center"><Video className="w-10 h-10 text-zinc-700 mx-auto mb-2" /><p className="text-zinc-600 text-sm">Generated video will appear here</p></div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
