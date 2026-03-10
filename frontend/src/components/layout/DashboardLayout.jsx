import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Megaphone, PenTool, Image, Calendar, BarChart3,
  Users, TrendingUp, Swords, MessageCircle, Bell, FileText, Settings, LogOut, Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navSections = [
  {
    label: "Core",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
      { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
      { to: "/content/create", icon: PenTool, label: "Content Creator" },
      { to: "/media", icon: Image, label: "Media Generator" },
      { to: "/calendar", icon: Calendar, label: "Calendar" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { to: "/analytics", icon: BarChart3, label: "Analytics" },
      { to: "/audience", icon: Users, label: "Audience" },
      { to: "/trends", icon: TrendingUp, label: "Trends" },
      { to: "/competitors", icon: Swords, label: "Competitors" },
      { to: "/sentiment", icon: MessageCircle, label: "Sentiment" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/alerts", icon: Bell, label: "Alerts" },
      { to: "/reports", icon: FileText, label: "Reports" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-zinc-950">
        <aside data-testid="sidebar" className="w-[220px] shrink-0 border-r border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex flex-col">
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-zinc-800">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight font-[Outfit]">
              Solis<span className="text-orange-500">Board</span>
            </span>
          </div>

          <ScrollArea className="flex-1 px-2 py-3">
            {navSections.map((section, si) => (
              <div key={si} className="mb-3">
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-3 mb-1.5">{section.label}</p>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.to} to={item.to} end={item.end}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[13px]">{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
                {si < navSections.length - 1 && <Separator className="my-2 bg-zinc-800/60" />}
              </div>
            ))}
          </ScrollArea>

          <div className="border-t border-zinc-800 p-2">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-zinc-600 truncate">{user?.email}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="logout-btn" onClick={handleLogout} className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
