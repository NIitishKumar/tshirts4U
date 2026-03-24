export function isReplicateInsufficientCredit(e) {
  const parts = [];
  if (e instanceof Error) {
    parts.push(e.message, String(e.status ?? ""));
  }
  if (e && typeof e === "object" && "response" in e) {
    const r = e.response;
    parts.push(String(r?.status), JSON.stringify(r?.data ?? ""));
  }
  const s = `${parts.join(" ")} ${String(e)}`.toLowerCase();
  return (
    s.includes("402") ||
    s.includes("insufficient credit") ||
    s.includes("payment required")
  );
}
