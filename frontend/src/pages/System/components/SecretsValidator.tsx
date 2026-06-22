import React from "react";
import { Key, CheckCircle, XCircle } from "lucide-react";

interface SecretItem {
  key: string;
  status: "configured" | "missing";
  maskedValue: string;
  desc: string;
}

export const SecretsValidator: React.FC = () => {
  const secrets: SecretItem[] = [
    { key: "OPENAI_API_KEY", status: "configured", maskedValue: "sk-proj-4f...X9y", desc: "AI matching engine embeddings" },
    { key: "DATABASE_URL", status: "configured", maskedValue: "postgresql://rc_db...local", desc: "Persistent candidate storage" },
    { key: "REDIS_URL", status: "configured", maskedValue: "redis://127.0.0.1...6379", desc: "API response cache registry" },
    { key: "JWT_SECRET", status: "configured", maskedValue: "sh-256-f8...ca3", desc: "Session encryption token keys" },
    { key: "VECTOR_DB_URL", status: "configured", maskedValue: "http://faiss-idx...5000", desc: "Vector indexing endpoint" },
    { key: "CANVA_API_KEY", status: "missing", maskedValue: "Config missing", desc: "Submission graphic assets loader" }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-xl border border-slate-200/10 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-900/60 flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
        <Key size={16} className="text-blue-500" />
        <span>Credentials & Environment Keys</span>
      </h3>

      <div className="flex flex-col gap-3">
        {secrets.map((item) => (
          <div
            key={item.key}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/5 dark:border-slate-850 bg-slate-200/20 dark:bg-slate-950/20 gap-3"
          >
            <div className="flex flex-col">
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                {item.key}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5 leading-normal">
                {item.desc}
              </span>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-center">
              <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-slate-300/40 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300/10 shadow-sm select-all">
                {item.maskedValue}
              </span>

              {item.status === "configured" ? (
                <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-black uppercase">
                  <CheckCircle size={12} />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[9px] text-amber-500 font-black uppercase">
                  <XCircle size={12} />
                  <span>Missing</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecretsValidator;
