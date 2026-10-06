"use client";

import { useEffect } from "react";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="panel mx-auto max-w-xl p-8 text-center" role="alert">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-xl text-red-700">!</div>
      <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-[#68736e]">Your Roomly data is safe. Try loading this section again, or return to the dashboard.</p>
      {error.digest && <p className="mt-3 text-xs text-[#7c857f]">Reference: {error.digest}</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="button button-primary" onClick={() => retry()}>Try again</button>
        <a className="button button-secondary" href="/dashboard">Return to dashboard</a>
      </div>
    </section>
  );
}
