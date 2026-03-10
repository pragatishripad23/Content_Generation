import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { brands, socialAccounts, team } from "@/lib/api";
import { Settings, Users, Globe, Plus, Trash2, Loader2, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [brand, setBrand] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const brandId = user?.brand?.id;

  // Dialog states
  const [accDialog, setAccDialog] = useState(false);
  const [memDialog, setMemDialog] = useState(false);
  const [accForm, setAccForm] = useState({ platform: "instagram", handle: "", followers: 0 });
  const [memForm, setMemForm] = useState({ email: "", name: "", role: "editor" });

  const load = async () => {
    if (!brandId) return;
    try {
      const [b, a, m] = await Promise.all([brands.list(), socialAccounts.list(brandId), team.list(brandId)]);
      setBrand((b.data || [])[0] || null);
      setAccounts(a.data || []);
      setMembers(m.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [brandId]); // eslint-disable-line

  const handleSaveBrand = async () => {
    if (!brand) return;
    setSaving(true);
    try {
      await brands.update(brandId, { name: brand.name, voice: brand.voice, colors: brand.colors, fonts: brand.fonts, logo_url: brand.logo_url, industry: brand.industry, keywords: brand.keywords });
      toast.success("Brand profile updated");
    } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try { await socialAccounts.add(brandId, accForm); toast.success("Account connected"); setAccDialog(false); load(); } catch { toast.error("Failed"); }
  };
  const handleRemoveAccount = async (id) => { await socialAccounts.remove(brandId, id); toast.success("Removed"); load(); };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try { await team.add(memForm); toast.success("Member added"); setMemDialog(false); load(); } catch { toast.error("Failed"); }
  };
  const handleRemoveMember = async (id) => { await team.remove(id); toast.success("Removed"); load(); };
  const handleRoleChange = async (id, role) => { await team.updateRole(id, role); toast.success("Role updated"); load(); };

  const updateBrand = (field, value) => setBrand((p) => p ? { ...p, [field]: value } : p);
  const roleColors = { admin: "text-orange-400", editor: "text-blue-400", viewer: "text-zinc-400", approver: "text-emerald-400" };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-5xl" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-[Outfit]">Settings</h1>
        <p className="text-zinc-500 mt-1 text-sm">Brand profile, connected accounts, and team management</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="brand" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"><Settings className="w-3 h-3 mr-1.5" />Brand</TabsTrigger>
          <TabsTrigger value="accounts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Globe className="w-3 h-3 mr-1.5" />Accounts</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"><Users className="w-3 h-3 mr-1.5" />Team</TabsTrigger>
        </TabsList>

        {/* Brand */}
        <TabsContent value="brand">
          {brand && (
            <div className="card-grid-border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-zinc-400 text-xs">Brand Name</Label><Input value={brand.name || ""} onChange={(e) => updateBrand("name", e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white" /></div>
                <div className="space-y-2"><Label className="text-zinc-400 text-xs">Industry</Label><Input value={brand.industry || ""} onChange={(e) => updateBrand("industry", e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white" /></div>
                <div className="space-y-2"><Label className="text-zinc-400 text-xs">Brand Voice</Label>
                  <Select value={brand.voice || "professional"} onValueChange={(v) => updateBrand("voice", v)}>
                    <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {["professional", "casual", "bold", "friendly", "authoritative", "witty"].map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label className="text-zinc-400 text-xs">Logo URL</Label><Input value={brand.logo_url || ""} onChange={(e) => updateBrand("logo_url", e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white" placeholder="https://" /></div>
              </div>
              <div className="space-y-2"><Label className="text-zinc-400 text-xs">Keywords (comma-separated)</Label><Input value={(brand.keywords || []).join(", ")} onChange={(e) => updateBrand("keywords", e.target.value.split(",").map((k) => k.trim()))} className="bg-zinc-950/50 border-zinc-800 text-white" /></div>
              <Button onClick={handleSaveBrand} disabled={saving} className="bg-orange-600 hover:bg-orange-500 text-white"><Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </TabsContent>

        {/* Social Accounts */}
        <TabsContent value="accounts">
          <div className="card-grid-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit]">Connected Accounts ({accounts.length})</h3>
              <Dialog open={accDialog} onOpenChange={setAccDialog}>
                <DialogTrigger asChild><Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white text-xs"><Plus className="w-3 h-3 mr-1" />Connect</Button></DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white"><DialogHeader><DialogTitle className="font-[Outfit]">Connect Account</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddAccount} className="space-y-4 mt-2">
                    <Select value={accForm.platform} onValueChange={(v) => setAccForm((p) => ({ ...p, platform: v }))}><SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">{["instagram", "twitter", "linkedin", "facebook", "tiktok", "youtube"].map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent></Select>
                    <Input value={accForm.handle} onChange={(e) => setAccForm((p) => ({ ...p, handle: e.target.value }))} placeholder="@handle" className="bg-zinc-950/50 border-zinc-800 text-white" />
                    <Input type="number" value={accForm.followers} onChange={(e) => setAccForm((p) => ({ ...p, followers: parseInt(e.target.value) || 0 }))} placeholder="Followers" className="bg-zinc-950/50 border-zinc-800 text-white" />
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white">Connect Account</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {accounts.map((a, i) => (
                <div key={a.id || i} className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/40">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <div className="flex-1"><p className="text-sm text-zinc-200">{a.handle}</p><p className="text-xs text-zinc-500 capitalize">{a.platform} · {a.followers?.toLocaleString()} followers</p></div>
                  <button onClick={() => handleRemoveAccount(a.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {accounts.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No accounts connected</p>}
            </div>
          </div>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team">
          <div className="card-grid-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-300 font-[Outfit]">Team Members ({members.length})</h3>
              <Dialog open={memDialog} onOpenChange={setMemDialog}>
                <DialogTrigger asChild><Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white text-xs"><Plus className="w-3 h-3 mr-1" />Invite</Button></DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white"><DialogHeader><DialogTitle className="font-[Outfit]">Invite Team Member</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-4 mt-2">
                    <Input value={memForm.name} onChange={(e) => setMemForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" className="bg-zinc-950/50 border-zinc-800 text-white" />
                    <Input type="email" value={memForm.email} onChange={(e) => setMemForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" className="bg-zinc-950/50 border-zinc-800 text-white" />
                    <Select value={memForm.role} onValueChange={(v) => setMemForm((p) => ({ ...p, role: v }))}><SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">{["admin", "editor", "viewer", "approver"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select>
                    <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white">Invite Member</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={m.id || i} className="flex items-center gap-3 p-3 rounded-md bg-zinc-900/40">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">{m.name?.charAt(0)?.toUpperCase()}</div>
                  <div className="flex-1"><p className="text-sm text-zinc-200">{m.name}</p><p className="text-xs text-zinc-500">{m.email}</p></div>
                  <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v)}>
                    <SelectTrigger className="w-28 h-7 text-xs bg-zinc-900 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{["admin", "editor", "viewer", "approver"].map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => handleRemoveMember(m.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No team members yet</p>}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
