#!/usr/bin/env bash
# ============================================================
# NorthStar — School Year Seed Script
# Creates realistic incident data spanning the school year
#
# Distribution:
#   20% → 0 incidents
#   40% → 1–2 incidents
#   25% → 3–5 incidents
#   15% → 6–10 incidents
# ============================================================

BASE="http://localhost:8080"
ADMIN_USER="admin"
ADMIN_PASS='Admin!2025#'
AUTH_HEADER="Authorization: Basic $(printf '%s:%s' "$ADMIN_USER" "$ADMIN_PASS" | base64)"
DISTRICT_HEADER="X-District-Id: 1"

SCHOOL_START="2025-08-25"

# ---- macOS (BSD date) compatible epoch helpers ----
to_epoch() {
  date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null || date -d "$1" +%s
}

epoch_to_iso() {
  date -j -r "$1" +"%Y-%m-%dT%H:%M:%S-05:00" 2>/dev/null || date -d "@$1" +"%Y-%m-%dT%H:%M:%S-05:00"
}

START_EPOCH=$(to_epoch "$SCHOOL_START")
TODAY_EPOCH=$(date +%s)
RANGE=$(( TODAY_EPOCH - START_EPOCH ))

random_date() {
  local offset=$(( (RANDOM * 32768 + RANDOM) % RANGE ))
  epoch_to_iso $(( START_EPOCH + offset ))
}

CATEGORIES=("DISRUPTION" "DEFIANCE" "AGGRESSION" "BULLYING" "PROPERTY_DAMAGE" "TARDY" "ABSENCE" "INAPPROPRIATE_LANGUAGE" "TECHNOLOGY_MISUSE" "DRESS_CODE")
SEVERITIES=("LOW" "MEDIUM" "HIGH")
DESCRIPTIONS=(
  "Student disrupted class by talking loudly."
  "Refused to follow teacher instructions."
  "Verbal altercation with another student."
  "Repeated tardiness without excuse."
  "Unauthorized use of phone during instruction."
  "Arguing with staff member."
  "Left class without permission."
  "Disruptive behavior in hallway."
  "Failed to complete assigned work repeatedly."
  "Intimidating behavior toward peers."
)

# ---- Fetch students ----
echo "==> Fetching all students..."
STUDENTS_JSON=$(curl -sf -H "$AUTH_HEADER" -H "$DISTRICT_HEADER" "${BASE}/api/students")

if [ -z "$STUDENTS_JSON" ] || [ "$STUDENTS_JSON" = "[]" ]; then
  echo "ERROR: No students found. Is the backend running?"
  exit 1
fi

# Use python3 to write IDs to a temp file (no mapfile needed)
TMP_IDS=$(mktemp)
TMP_TEACHERS=$(mktemp)
trap 'rm -f "$TMP_IDS" "$TMP_TEACHERS"' EXIT

python3 -c "
import sys, json
students = json.load(sys.stdin)
for s in students:
    print(s['id'])
" <<< "$STUDENTS_JSON" > "$TMP_IDS"

TOTAL=$(wc -l < "$TMP_IDS" | tr -d ' ')
echo "    Found ${TOTAL} students"

# ---- Fetch teachers ----
echo "==> Fetching teachers..."
TEACHERS_JSON=$(curl -sf -H "$AUTH_HEADER" -H "$DISTRICT_HEADER" "${BASE}/api/teachers" 2>/dev/null || echo "[]")

python3 -c "
import sys, json
teachers = json.load(sys.stdin)
if not teachers:
    print('Admin User')
else:
    for t in teachers:
        fn = t.get('firstName','')
        ln = t.get('lastName','')
        name = (fn + ' ' + ln).strip()
        if name:
            print(name)
" <<< "$TEACHERS_JSON" > "$TMP_TEACHERS" 2>/dev/null || echo "Admin User" > "$TMP_TEACHERS"

TEACHER_COUNT=$(wc -l < "$TMP_TEACHERS" | tr -d ' ')
echo "    Using ${TEACHER_COUNT} teacher(s) as reporters"

# ---- Main loop ----
echo ""
echo "==> Seeding incidents..."
echo ""

created=0
zero_count=0
errors=0
student_num=0

while IFS= read -r sid; do
  [ -z "$sid" ] && continue
  student_num=$(( student_num + 1 ))

  roll=$(( RANDOM % 100 ))

  if   [ "$roll" -lt 20 ]; then count=0
  elif [ "$roll" -lt 60 ]; then count=$(( (RANDOM % 2) + 1 ))
  elif [ "$roll" -lt 85 ]; then count=$(( (RANDOM % 3) + 3 ))
  else                           count=$(( (RANDOM % 5) + 6 ))
  fi

  if [ "$count" -eq 0 ]; then
    zero_count=$(( zero_count + 1 ))
    printf "  [%3d/%s] Student %-5s → 0 incidents (skip)\n" "$student_num" "$TOTAL" "$sid"
    continue
  fi

  printf "  [%3d/%s] Student %-5s → %d incident(s)\n" "$student_num" "$TOTAL" "$sid" "$count"

  i=0
  while [ "$i" -lt "$count" ]; do
    cat_idx=$(( RANDOM % 10 ))
    sev_idx=$(( RANDOM % 3 ))
    desc_idx=$(( RANDOM % 10 ))
    teacher_idx=$(( RANDOM % TEACHER_COUNT + 1 ))

    category=${CATEGORIES[$cat_idx]}
    severity=${SEVERITIES[$sev_idx]}
    description=${DESCRIPTIONS[$desc_idx]}
    occurred=$(random_date)
    reporter=$(sed -n "${teacher_idx}p" "$TMP_TEACHERS")

    payload=$(printf '{"studentId":%s,"category":"%s","description":"%s","severity":"%s","reportedBy":"%s","occurredAt":"%s"}' \
      "$sid" "$category" "$description" "$severity" "$reporter" "$occurred")

    http_code=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST "${BASE}/api/incidents" \
      -H "Content-Type: application/json" \
      -H "$AUTH_HEADER" \
      -H "$DISTRICT_HEADER" \
      -d "$payload")

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
      created=$(( created + 1 ))
    else
      errors=$(( errors + 1 ))
      echo "    WARNING: HTTP $http_code for student $sid"
    fi

    sleep 0.03
    i=$(( i + 1 ))
  done
done < "$TMP_IDS"

echo ""
echo "=============================================="
echo "  Seed complete!"
echo "  Total students : ${TOTAL}"
echo "  Zero incidents : ${zero_count} ($(( zero_count * 100 / TOTAL ))%)"
echo "  Incidents made : ${created}"
echo "  Errors         : ${errors}"
echo "=============================================="
