"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f5f6f3", color: "#16211c", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 520, border: "1px solid #dfe4df", borderRadius: 24, background: "white", padding: 32, textAlign: "center" }} role="alert">
            <h1 style={{ margin: 0, fontSize: 28 }}>Roomly could not load this page</h1>
            <p style={{ margin: "12px 0 0", color: "#68736e", lineHeight: 1.6 }}>Please try again. If the problem continues, share the reference number with support.</p>
            {error.digest && <p style={{ margin: "12px 0 0", color: "#7c857f", fontSize: 12 }}>Reference: {error.digest}</p>}
            <button onClick={() => retry()} style={{ marginTop: 24, border: 0, borderRadius: 12, background: "#173f35", color: "white", cursor: "pointer", padding: "12px 18px", fontWeight: 700 }}>Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
