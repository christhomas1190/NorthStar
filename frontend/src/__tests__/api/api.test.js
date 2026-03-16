/**
 * Tests for src/lib/api.js
 * Covers: getJSON, postJSON, putJSON, delJSON, auth headers, error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getJSON, postJSON, putJSON, delJSON, attachAuthBridge } from "@/lib/api.js";

// ── helpers ─────────────────────────────────────────────────────────────────

function mockFetch(status, body, contentType = "application/json") {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  };
  return vi.fn().mockResolvedValue(res);
}

// ── setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.setItem("ns_token", "Basic dGVzdDp0ZXN0");
  localStorage.setItem("ns_active_district", "10");
  // Reset auth bridge to read from localStorage (default behaviour)
  attachAuthBridge(
    () => localStorage.getItem("ns_token") || "",
    () => Number(localStorage.getItem("ns_active_district")) || undefined
  );
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ── getJSON ──────────────────────────────────────────────────────────────────

describe("getJSON", () => {
  it("makes a GET request to the given URL", async () => {
    const fetch = mockFetch(200, { id: 1 });
    vi.stubGlobal("fetch", fetch);

    await getJSON("/api/students");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain("/api/students");
    expect(opts.headers["Authorization"]).toBe("Basic dGVzdDp0ZXN0");
    expect(opts.headers["X-District-Id"]).toBe("10");
  });

  it("returns parsed JSON body on success", async () => {
    vi.stubGlobal("fetch", mockFetch(200, [{ id: 1 }, { id: 2 }]));
    const result = await getJSON("/api/students");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("throws on 404 response", async () => {
    vi.stubGlobal("fetch", mockFetch(404, "Not Found", "text/plain"));
    await expect(getJSON("/api/students/999")).rejects.toThrow();
  });

  it("throws on 401 and dispatches ns:unauthorized event", async () => {
    vi.stubGlobal("fetch", mockFetch(401, "Unauthorized", "text/plain"));
    const events = [];
    window.addEventListener("ns:unauthorized", (e) => events.push(e));

    await expect(getJSON("/api/students")).rejects.toThrow();
    expect(events.length).toBe(1);
  });

  it("includes auth headers from attachAuthBridge override", async () => {
    attachAuthBridge(() => "Basic override123", () => 99);
    const fetch = mockFetch(200, {});
    vi.stubGlobal("fetch", fetch);

    await getJSON("/api/test");

    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Basic override123");
    expect(opts.headers["X-District-Id"]).toBe("99");
  });
});

// ── postJSON ─────────────────────────────────────────────────────────────────

describe("postJSON", () => {
  it("makes a POST request with JSON body", async () => {
    const fetch = mockFetch(201, { id: 10 });
    vi.stubGlobal("fetch", fetch);

    const body = { firstName: "Ada", lastName: "Lovelace" };
    await postJSON("/api/students", body);

    const [url, opts] = fetch.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual(body);
  });

  it("returns parsed JSON response", async () => {
    vi.stubGlobal("fetch", mockFetch(201, { id: 42, firstName: "Ada" }));
    const result = await postJSON("/api/students", {});
    expect(result.id).toBe(42);
  });

  it("throws on error response", async () => {
    vi.stubGlobal("fetch", mockFetch(409, "Conflict", "text/plain"));
    await expect(postJSON("/api/students", {})).rejects.toThrow();
  });
});

// ── putJSON ──────────────────────────────────────────────────────────────────

describe("putJSON", () => {
  it("makes a PUT request with JSON body", async () => {
    const fetch = mockFetch(200, { id: 1, firstName: "Updated" });
    vi.stubGlobal("fetch", fetch);

    await putJSON("/api/students/1", { firstName: "Updated" });

    const [url, opts] = fetch.mock.calls[0];
    expect(opts.method).toBe("PUT");
    expect(JSON.parse(opts.body)).toEqual({ firstName: "Updated" });
  });

  it("returns updated DTO", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { id: 1, firstName: "NewName" }));
    const result = await putJSON("/api/students/1", {});
    expect(result.firstName).toBe("NewName");
  });
});

// ── delJSON ──────────────────────────────────────────────────────────────────

describe("delJSON", () => {
  it("makes a DELETE request", async () => {
    const fetch = mockFetch(204, "", "text/plain");
    vi.stubGlobal("fetch", fetch);

    await delJSON("/api/students/1");

    const [url, opts] = fetch.mock.calls[0];
    expect(opts.method).toBe("DELETE");
    expect(url).toContain("/api/students/1");
  });

  it("includes auth headers on DELETE", async () => {
    const fetch = mockFetch(204, "", "text/plain");
    vi.stubGlobal("fetch", fetch);

    await delJSON("/api/incidents/5");

    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers["Authorization"]).toBe("Basic dGVzdDp0ZXN0");
  });
});
