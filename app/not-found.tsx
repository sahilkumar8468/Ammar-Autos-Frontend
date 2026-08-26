import React from "react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc", fontFamily: "sans-serif" }}>
      <div style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center", maxWidth: "400px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}>404 - Page Not Found</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>The requested page could not be found.</p>
        <a href="/dashboard" style={{ display: "inline-block", padding: "10px 20px", backgroundColor: "#0f172a", color: "#ffffff", fontWeight: "bold", fontSize: "12px", borderRadius: "12px", textDecoration: "none" }}>
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
