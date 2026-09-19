import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Bell, Map, Menu, Plus, X, Zap } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  onOpenOptimizer: () => void;
  alertCount: number;
  incidentCount?: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  dataStatus: "loading" | "live" | "degraded";
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewIncident, onOpenOptimizer, alertCount, incidentCount = 0, isSidebarOpen = true, onToggleSidebar, dataStatus }) => {
  const [showAlerts, setShowAlerts] = useState(false);
  useEffect(() => {
    if (!showAlerts) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setShowAlerts(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [showAlerts]);
  const statusTone = dataStatus === "live" ? "bg-emerald-400" : dataStatus === "degraded" ? "bg-rose-400" : "bg-amber-300";

  return <header className="relative z-30 border-b border-white/10 bg-[#0b1020] text-white shadow-[0_12px_32px_rgba(2,6,23,.16)]">
    <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 shadow-lg shadow-blue-500/20"><Activity className="size-5 text-slate-950" strokeWidth={2.6} /></div><div className="hidden min-[420px]:block"><div className="font-heading text-sm font-semibold tracking-tight">RESPONDR <span className="text-cyan-300">/ COMMAND</span></div><p className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Emergency operations network</p></div>{onToggleSidebar && <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label={isSidebarOpen ? "Hide incident queue" : "Show incident queue"} className="size-8 text-slate-300 hover:bg-white/10 hover:text-white"><Menu className="size-4" /></Button>}</div>
      <Separator orientation="vertical" className="hidden h-6 bg-white/10 sm:block" />
      <nav aria-label="Workspace views" className="flex items-center rounded-lg bg-white/5 p-1"><button onClick={() => setActiveTab("map")} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${activeTab === "map" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}><Map className="size-3.5" /><span className="hidden sm:inline">Live map</span></button><button onClick={() => setActiveTab("analytics")} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${activeTab === "analytics" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}><BarChart3 className="size-3.5" /><span className="hidden sm:inline">Intelligence</span></button></nav>
      <div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 sm:flex" aria-live="polite"><span className={`size-1.5 rounded-full ${statusTone}`} /><span className="text-[10px] font-medium text-slate-300">{dataStatus === "live" ? "LIVE" : dataStatus === "degraded" ? "DEGRADED" : "SYNCING"}</span></div><Badge variant="outline" className="hidden border-white/10 bg-white/5 text-[10px] text-slate-300 md:inline-flex">{incidentCount} active</Badge><Button variant="ghost" size="icon" onClick={() => setShowAlerts(true)} className="relative size-8 text-slate-300 hover:bg-white/10 hover:text-white" aria-label={`Alerts, ${alertCount} active`}><Bell className="size-4" />{alertCount > 0 && <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-bold text-white">{alertCount}</span>}</Button><Button variant="outline" size="sm" onClick={onOpenOptimizer} className="hidden border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white sm:inline-flex"><Zap className="size-3.5 text-amber-300" /> Optimize</Button><Button size="sm" onClick={onOpenNewIncident} className="bg-rose-500 text-white hover:bg-rose-400"><Plus className="size-3.5" /><span className="hidden sm:inline">New incident</span></Button></div>
    </div>
    {showAlerts && <div className="fixed inset-0 z-[2500] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="alert-title" className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-5 text-slate-100 shadow-2xl"><div className="mb-4 flex items-start justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">Operations alerting</p><h2 id="alert-title" className="mt-1 font-heading text-lg font-semibold">Priority queue</h2></div><Button autoFocus variant="ghost" size="icon" onClick={() => setShowAlerts(false)} className="text-slate-400 hover:bg-white/10 hover:text-white"><X className="size-4" /></Button></div><div className="rounded-xl border border-amber-400/20 bg-amber-300/10 p-4"><AlertTriangle className="mb-2 size-4 text-amber-300" /><p className="text-sm font-medium">{alertCount ? `${alertCount} item${alertCount === 1 ? "" : "s"} require operator review.` : "No active priority advisories."}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Verify the incident queue and dispatch workflow before taking action.</p></div><Button className="mt-4 w-full" onClick={() => setShowAlerts(false)}>Acknowledge</Button></section></div>}
  </header>;
};
