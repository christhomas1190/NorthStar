let getToken = () => "";
let getDistrictId = () => undefined;

export function attachAuthBridge(fnToken, fnDistrictId) {
  getToken = fnToken || (() => "");
  getDistrictId = fnDistrictId || (() => undefined);
}

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function handle(res) {
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) window.dispatchEvent(new CustomEvent("ns:unauthorized"));
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

function commonHeaders(extra = {}) {
  const t = getToken?.() || "";
  const d = getDistrictId?.();
  return {
    "Content-Type": "application/json",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...(d ? { "X-District-Id": String(d) } : {}),
    ...extra,
  };
}

export async function getJSON(url) {
  const res = await fetch(API_BASE + url, { headers: commonHeaders() });
  return handle(res);
}
export async function postJSON(url, body) {
  const res = await fetch(API_BASE + url, { method: "POST", headers: commonHeaders(), body: JSON.stringify(body) });
  return handle(res);
}
export async function putJSON(url, body) {
  const res = await fetch(API_BASE + url, { method: "PUT", headers: commonHeaders(), body: JSON.stringify(body) });
  return handle(res);
}
export async function delJSON(url) {
  const res = await fetch(API_BASE + url, { method: "DELETE", headers: commonHeaders() });
  return handle(res);
}
