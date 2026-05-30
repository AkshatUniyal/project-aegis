"use client";

export function Field({ label, children, hint }: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <label className="block">
      <div className="label-eyebrow mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>{hint}</div>}
    </label>
  );
}

const baseInput =
  "w-full bg-[var(--bg-2)] border rounded-lg px-3 py-2 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--brand)]";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={baseInput} style={{ borderColor: "var(--border)" }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={baseInput + " resize-none leading-relaxed"} style={{ borderColor: "var(--border)" }} />;
}

export function Select({ options, ...props }: {
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={baseInput + " appearance-none cursor-pointer"} style={{ borderColor: "var(--border)" }}>
      {options.map((o) => <option key={o} value={o} style={{ background: "#0b1120" }}>{o}</option>)}
    </select>
  );
}
