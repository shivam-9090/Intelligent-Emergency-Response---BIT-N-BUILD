import React, { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Bell, ChevronRight, Clock3, Map, Menu, Plus, X, Zap } from "lucide-react";
import type { Alert } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  onOpenOptimizer: () => void;
  alerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
  incidentCount?: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  dataStatus: "loading" | "live" | "degraded";
  isAuthenticated: boolean;
  onOpenSignIn: () => void;
  onSignOut: () => void;
}

const alertLabel = (type: Alert["alert_type"]) => type.replace(/_/g, " ");

const alertTone = (type: Alert["alert_type"]) => {
  if (type === "critical_incident") return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (type === "escalation") return "border-amber-300/30 bg-amber-300/10 text-amber-200";
  return "border-sky-300/30 bg-sky-300/10 text-sky-200";
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIncident,
  onOpenOptimizer,
  alerts,
  onSelectAlert,
  incidentCount = 0,
  isSidebarOpen = true,
  onToggleSidebar,
  dataStatus,
  isAuthenticated,
  onOpenSignIn,
  onSignOut,
}) => {
  const [showAlerts, setShowAlerts] = useState(false);
  const unresolvedAlerts = useMemo(() => alerts.filter((alert) => !alert.resolved), [alerts]);

  useEffect(() => {
    if (!showAlerts) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setShowAlerts(false);
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [showAlerts]);

  const statusTone = dataStatus === "live" ? "bg-emerald-400" : dataStatus === "degraded" ? "bg-rose-400" : "bg-amber-300";

  return (
    <header className="relative z-30 border-b border-white/10 bg-[#0b1020] text-white shadow-[0_12px_32px_rgba(2,6,23,.16)]">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 shadow-lg shadow-blue-500/20"><Activity className="size-5 text-slate-950" strokeWidth={2.6} /></div>
          <div className="hidden min-[420px]:block"><div className="font-heading text-sm font-semibold tracking-tight">RESPONDR <span className="text-cyan-300">/ COMMAND</span></div><p className="text-[10px] font-medium uppercase tracking-[.16em] text-slate-500">Emergency operations network</p></div>
          {onToggleSidebar && <Button variant="ghost" size="icon" onClick={onToggleSidebar} aria-label={isSidebarOpen ? "Hide incident queue" : "Show incident queue"} className="size-8 text-slate-300 hover:bg-white/10 hover:text-white"><Menu className="size-4" /></Button>}
        </div>
        <Separator orientation="vertical" className="hidden h-6 bg-white/10 sm:block" />
        <nav aria-label="Workspace views" className="flex items-center rounded-lg bg-white/5 p-1">
          <button onClick={() => setActiveTab("map")} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${activeTab === "map" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}><Map className="size-3.5" /><span className="hidden sm:inline">Live map</span></button>
          <button onClick={() => setActiveTab("analytics")} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${activeTab === "analytics" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:text-white"}`}><BarChart3 className="size-3.5" /><span className="hidden sm:inline">Intelligence</span></button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 sm:flex" aria-live="polite"><span className={`size-1.5 rounded-full ${statusTone}`} /><span className="text-[10px] font-medium text-slate-300">{dataStatus === "live" ? "LIVE" : dataStatus === "degraded" ? "DEGRADED" : "SYNCING"}</span></div>
          <Badge variant="outline" className="hidden border-white/10 bg-white/5 text-[10px] text-slate-300 md:inline-flex">{incidentCount} active</Badge>
          {isAuthenticated ? <Button variant="ghost" size="sm" onClick={onSignOut} className="hidden text-xs text-cyan-200 hover:bg-white/10 hover:text-white sm:inline-flex">Live connected</Button> : <Button variant="outline" size="sm" onClick={onOpenSignIn} className="hidden border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 hover:text-white sm:inline-flex">Connect live</Button>}
          <Button variant="ghost" size="icon" onClick={() => setShowAlerts(true)} className="relative size-8 text-slate-300 hover:bg-white/10 hover:text-white" aria-label={`Alerts, ${unresolvedAlerts.length} active`}><Bell className="size-4" />{unresolvedAlerts.length > 0 && <span className="absolute right-0.5 top-0.5 grid size-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-bold text-white">{unresolvedAlerts.length > 99 ? "99+" : unresolvedAlerts.length}</span>}</Button>
          <Button variant="outline" size="sm" onClick={onOpenOptimizer} className="hidden border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white sm:inline-flex"><Zap className="size-3.5 text-amber-300" /> Optimize</Button>
          <Button size="sm" onClick={onOpenNewIncident} className="bg-rose-500 text-white hover:bg-rose-400"><Plus className="size-3.5" /><span className="hidden sm:inline">New incident</span></Button>
        </div>
      </div>

      {showAlerts && (
        <div className="fixed inset-0 z-[2500] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="alert-title" className="flex max-h-[min(82vh,660px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-cyan-300">Operations alerting</p><h2 id="alert-title" className="mt-1 font-heading text-lg font-semibold">Live alert inbox</h2><p className="mt-1 text-xs text-slate-400">{unresolvedAlerts.length} unresolved alert{unresolvedAlerts.length === 1 ? "" : "s"} from the response service.</p></div>
              <Button autoFocus variant="ghost" size="icon" onClick={() => setShowAlerts(false)} className="text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close alerts"><X className="size-4" /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {unresolvedAlerts.length === 0 ? (
                <div className="grid min-h-48 place-items-center px-6 text-center"><div><Bell className="mx-auto mb-3 size-5 text-emerald-300" /><p className="text-sm font-medium text-slate-100">No unresolved alerts</p><p className="mt-1 text-xs leading-relaxed text-slate-400">The backend has not reported a critical incident, response delay, or escalation requiring review.</p></div></div>
              ) : (
                <div className="space-y-2">
                  {unresolvedAlerts.map((alert) => (
                    <button key={alert.id} type="button" onClick={() => { setShowAlerts(false); onSelectAlert(alert); }} className="group w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                      <div className="flex items-start gap-3"><span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border ${alertTone(alert.alert_type)}`}><AlertTriangle className="size-3.5" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-300">{alertLabel(alert.alert_type)}</span><ChevronRight className="size-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-200" /></div><p className="mt-1 text-sm leading-5 text-slate-100">{alert.message}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400"><Clock3 className="size-3" />{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.created_at))}</p></div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {unresolvedAlerts.length > 0 && <div className="border-t border-white/10 px-5 py-3 text-[10px] text-slate-400">Select an alert to open its associated incident. Resolution is performed only through the authenticated dispatch workflow.</div>}
          </section>
        </div>
      )}
    </header>
  );
};
