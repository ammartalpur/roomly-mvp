export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68736e]">{description}</p></div>{action}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-[#cbd4cd] px-6 py-12 text-center"><p className="font-semibold">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm text-[#768079]">{description}</p></div>;
}
