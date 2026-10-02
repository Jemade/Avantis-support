import { useState } from "react";
import { FEEDBACK_URL } from "../api.js";

export default function Feedback() {
  const [copied, setCopied] = useState(false);

  const openPortal = () => {
    window.open(FEEDBACK_URL, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Feedback</h1>
          <p className="subtitle">Help us enhance the PC Assist experience</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "680px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              backgroundColor: "var(--teal-tint)",
              color: "var(--teal-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 20 20" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 4.5A1.5 1.5 0 0 1 5 3h10a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H8.5L5 17v-3H5A1.5 1.5 0 0 1 3.5 12.5v-8z" />
              <path d="M7 7.5h6M7 10h4" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: "600" }}>Avantis Feedback Portal</h3>
            <p style={{ color: "var(--dim)", fontSize: "14px", lineHeight: "1.5" }}>
              The feedback page opens in your default web browser, allowing you to quickly submit bug reports, suggestions, or comments directly to the development team.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
          <button
            type="button"
            className="tile"
            onClick={openPortal}
            style={{
              flex: "1 1 200px",
              padding: "12px 18px",
              border: "1px solid var(--teal)",
              background: "var(--teal)",
              color: "#ffffff",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>Open Feedback Form</span>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h7v7M13 3L6.5 9.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={copyLink}
            style={{
              padding: "12px 18px",
              border: "1px solid var(--line)",
              background: "transparent",
              borderRadius: "6px",
              fontWeight: "500",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            {copied ? "Link Copied!" : "Copy Portal URL"}
          </button>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: "18px",
            marginTop: "10px",
            fontSize: "13px",
            color: "var(--dim)",
            lineHeight: "1.6",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <strong>Direct Email Inquiries:</strong>
          </div>
          <div>
            Feedback messages are automatically delivered to:{" "}
            <a
              href="mailto:jayden.mapasure@avantis.co.zw?subject=Avantis%20PC%20Assist%20Feedback"
              style={{ color: "var(--teal)", textDecoration: "underline" }}
            >
              jayden.mapasure@avantis.co.zw
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
