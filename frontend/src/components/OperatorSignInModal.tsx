import { useState } from "react";
import { Radio, X } from "lucide-react";
import { loginOperator } from "../api";
import { Button } from "./ui/button";

export function OperatorSignInModal({ onClose, onAuthenticated }: { onClose: () => void; onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { access_token } = await loginOperator(email, password);
      window.localStorage.setItem("access_token", access_token);
      onAuthenticated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="fixed inset-0 z-[2600] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#111827] p-5 text-slate-100 shadow-2xl" aria-labelledby="operator-sign-in-title">
      <div className="flex items-start justify-between"><div><span className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><Radio className="size-4" /></span><h2 id="operator-sign-in-title" className="mt-3 font-heading text-lg font-semibold">Connect live operations</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">Sign in with an approved dispatcher or administrator account to receive authenticated live events.</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close sign-in"><X className="size-4" /></Button></div>
      <label className="mt-5 block text-xs font-medium text-slate-300">Operator email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" placeholder="dispatcher@agency.gov" /></label>
      <label className="mt-3 block text-xs font-medium text-slate-300">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" /></label>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</p>}
      <Button disabled={isSubmitting} type="submit" className="mt-5 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">{isSubmitting ? "Connecting…" : "Sign in & connect"}</Button>
    </form>
  </div>;
}
