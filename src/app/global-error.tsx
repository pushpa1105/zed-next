"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 * It replaces the whole document, so it must render <html>/<body> and
 * cannot rely on global CSS. Keep it dependency-free.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100dvh",
          margin: 0,
          textAlign: "center",
        }}
      >
        <title>Something went wrong</title>
        <div>
          <h1 style={{ fontSize: "1.25rem" }}>Something went wrong</h1>
          <p>An unexpected error occurred.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
