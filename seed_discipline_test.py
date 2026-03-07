#!/usr/bin/env python3
"""Seed 4 students who need discipline: 2 CAUTION (4 incidents), 2 ESCALATED (6 incidents)."""

import urllib.request, urllib.error, json, base64, sys

BASE        = "http://localhost:8080"
SCHOOL_ID   = 1
DISTRICT_ID = 1
CREDS       = base64.b64encode(b"admin:Admin!2025#").decode()
HEADERS     = {
    "Authorization": f"Basic {CREDS}",
    "Content-Type":  "application/json",
    "X-District-Id": str(DISTRICT_ID),
}

def req(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        return None

# Dates within the 14-day window (window start = 2026-02-20)
CAUTION_DATES = [
    "2026-02-22T09:00:00-05:00",
    "2026-02-25T10:30:00-05:00",
    "2026-02-28T11:00:00-05:00",
    "2026-03-03T14:00:00-05:00",
]

ESCALATED_DATES = [
    "2026-02-21T08:00:00-05:00",
    "2026-02-23T10:00:00-05:00",
    "2026-02-25T12:00:00-05:00",
    "2026-02-27T09:30:00-05:00",
    "2026-03-01T11:00:00-05:00",
    "2026-03-04T14:00:00-05:00",
]

INCIDENTS = [
    {"category": "Disruption",  "severity": "MINOR",    "description": "Disrupted class repeatedly"},
    {"category": "Defiance",    "severity": "MODERATE", "description": "Refused teacher instructions"},
    {"category": "Harassment",  "severity": "MINOR",    "description": "Bothering other students"},
    {"category": "Tardiness",   "severity": "MINOR",    "description": "Arrived late without pass"},
    {"category": "Phone Use",   "severity": "MINOR",    "description": "Phone out during instruction"},
    {"category": "Disrespect",  "severity": "MODERATE", "description": "Disrespectful language toward staff"},
]

# Fetch existing students and pick 4
all_students = req("GET", "/api/students") or []
if len(all_students) < 4:
    print(f"Need at least 4 students, only found {len(all_students)}")
    sys.exit(1)

# Pick first 4 from the list
targets = all_students[:4]
date_sets = [CAUTION_DATES, CAUTION_DATES, ESCALATED_DATES, ESCALATED_DATES]

for i, s in enumerate(targets):
    label = "ESCALATED" if i >= 2 else "CAUTION"
    sid  = s["id"]
    name = f"{s['firstName']} {s['lastName']}"
    dates = date_sets[i]
    print(f"\n[{label}] Using existing student: {name} (id={sid})")

    for j, date in enumerate(dates):
        inc_template = INCIDENTS[j % len(INCIDENTS)]
        inc = {
            "studentId":   sid,
            "category":    inc_template["category"],
            "severity":    inc_template["severity"],
            "description": inc_template["description"],
            "reportedBy":  "Seed Script",
            "occurredAt":  date,
        }
        result = req("POST", f"/api/students/{sid}/incidents", inc)
        status = "ok" if result else "FAILED"
        print(f"  Incident {j+1}/{len(dates)} ({date[:10]}): {status}")

print("\nDone. Visit /admin/disciplines/required to see the flagged students.")
