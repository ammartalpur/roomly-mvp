"use client";

import { useFormStatus } from "react-dom";

export function FormButton({ children, className = "button button-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} type="submit">{pending ? "Saving…" : children}</button>;
}
