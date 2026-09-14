import React, { useState } from "react";
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { CompanyProfile } from "../types";

interface LoginModalProps {
  company: CompanyProfile;
  onLoginSuccess: (token: string, username: string) => void;
}

export default function LoginModal({ company, onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha no login");
      }

      onLoginSuccess(data.token, data.username);
    } catch (err: any) {
      setError(err.message || "Usuário ou senha incorretos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden relative">
        
        {/* Header decoration */}
        <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">Acesso Restrito</span>
              <h2 className="text-xl font-black text-white">{company.name || "CRM Comercial"}</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {company.subtitle || "Digite suas credenciais corporativas para acessar a gestão de leads e vendas."}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-shake">
              <Lock className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Usuário de Acesso</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Senha Secreta</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 text-center font-medium">
            <span className="text-slate-400">Credenciais padrão iniciais: </span>
            <code className="text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">admin</code>
            <span className="text-slate-400"> / </span>
            <code className="text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">123</code>
          </div>
        </form>

      </div>
    </div>
  );
}
