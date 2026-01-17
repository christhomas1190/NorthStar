#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://localhost:8080}"
command -v jq >/dev/null 2>&1 || { echo "jq is required"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required"; exit 1; }

DISTRICT_JSON=$(curl -sS -X POST "$BASE/api/districts" -H "Content-Type: application/json" -d '{"districtName":"Lindenwold Public Schools"}')
DISTRICT_ID=$(echo "$DISTRICT_JSON" | jq -r '.id|floor')

SCHOOL_JSON=$(curl -sS -X POST "$BASE/api/districts/'"$DISTRICT_ID"'/schools" -H "Content-Type: application/json" -d "{\"name\":\"Lindenwold Middle School\",\"districtId\":$DISTRICT_ID}")
SCHOOL_ID=$(echo "$SCHOOL_JSON" | jq -r '.id|floor')

ADMIN_JSON=$(curl -sS -X POST "$BASE/api/admin" -H "Content-Type: application/json" -d "{
  \"firstName\":\"Christian\",
  \"lastName\":\"Thomas\",
  \"email\":\"christian.thomas@lindenwold.org\",
  \"userName\":\"cthomas\",
  \"permissionTag\":\"SUPER_ADMIN\",
  \"districtId\":$DISTRICT_ID,
  \"schoolId\":$SCHOOL_ID
}")
ADMIN_ID=$(echo "$ADMIN_JSON" | jq -r '.id|floor')

TEACHER_JSON=$(curl -sS -X POST "$BASE/api/teachers" -H "Content-Type: application/json" -d "{
  \"firstName\":\"Jaimie\",
  \"lastName\":\"Thomas\",
  \"email\":\"jaimie.thomas@lindenwold.org\",
  \"districtId\":$DISTRICT_ID,
  \"schoolId\":$SCHOOL_ID
}")
TEACHER_ID=$(echo "$TEACHER_JSON" | jq -r '.id|floor')

FIRST=(Grace Marcus Sofia David Maya Ethan Olivia Liam Ava Noah Emma James Lucas Mia Charlotte Amelia Benjamin Elijah Isabella Harper Evelyn Abigail Jack Henry Scarlett Aria Chloe Zoe Lily Layla Luca Daniel Jacob Aiden Ellie Nora Riley Zoey Hannah Mila Aurora Violet Penelope Camila Stella Lucy Paisley Victoria Addison Eleanor Natalie Leah Savannah Brooklyn Bella Claire Skylar Samantha Kennedy Allison Hailey Sarah Alice Sadie Gabriella Anna Caroline Ruby Autumn Piper Quinn Eva Alina Elena Faith Madeline Jade Clara Maria Vivian Raelynn Aubrey Audrey Gianna Sophie Rylee Eliana Peyton Cora Kayla Reese Lydia Naomi Brooke Hadley Julia Lillian Ashley Londyn Allison)
LAST=(Hopper Lee Perez Chen Patel Johnson Brown Smith Davis Garcia Rodriguez Martinez Hernandez Lopez Gonzalez Wilson Anderson Thomas Taylor Moore Martin Jackson Thompson White Harris Sanchez Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Torres Nguyen Hill Flores Green Adams Nelson Baker Hall Rivera Campbell Mitchell Carter Roberts Gomez Phillips Evans Turner Diaz Parker Cruz Edwards Collins Reyes Stewart Morris Morales Murphy Cook Rogers Gutierrez Ortiz Morgan Cooper Peterson Bailey Reed Kelly Howard Ramos Ward Richardson Watson Brooks Chavez Wood Bennett Gray Mendoza Ruiz Hughes Price Alvarez Castillo Sanders Myers Long Ross Foster Jimenez Powell Jenkins Perry Russell Sullivan Bell Coleman Butler Henderson Barnes Fisher Vasquez Simmons Romero Jordan Patterson Hamilton Graham Reynolds Griffin Wallace)
CATS=("Disruption" "Defiance" "Peer Conflict" "Property Misuse" "Safety Concern" "Other")
SEVS=("Minor" "Major")

for i in $(seq 1 100); do
  fn=${FIRST[$(( (i-1) % ${#FIRST[@]} ))]}
  ln=${LAST[$(( (i-1) % ${#LAST[@]} ))]}
  sid=$(printf "S%05d" "$i")
  grade=$(( 6 + (i % 3) ))
  curl -sS -X POST "$BASE/api/students" -H "Content-Type: application/json" -H "X-District-Id: $DISTRICT_ID" -d "{
    \"firstName\":\"$fn\",
    \"lastName\":\"$ln\",
    \"studentId\":\"$sid\",
    \"grade\":\"$grade\",
    \"schoolId\":$SCHOOL_ID
  }" >/dev/null
done

STUDENTS=$(curl -sS "$BASE/api/students" -H "X-District-Id: $DISTRICT_ID")
STUDENT_IDS=($(echo "$STUDENTS" | jq -r '.[] | select(.schoolId=='"$SCHOOL_ID"') | .id|floor'))

N=${INC_COUNT:-120}
for i in $(seq 1 $N); do
  sid=${STUDENT_IDS[$((RANDOM % ${#STUDENT_IDS[@]}))]}
  cat=${CATS[$((RANDOM % ${#CATS[@]}))]}
  sev=${SEVS[$((RANDOM % 2))]}
  day_offset=$(( RANDOM % 30 ))
  hour=$(( RANDOM % 8 + 8 ))
  min=$(( RANDOM % 60 ))
  when=$(date -u -v-"$day_offset"d -v"$hour"H -v"$min"M +"%Y-%m-%dT%H:%M:00Z" 2>/dev/null || python3 - <<'PY'
import random,datetime
d=datetime.datetime.utcnow()-datetime.timedelta(days=random.randint(0,29))
d=d.replace(hour=random.randint(8,15),minute=random.randint(0,59),second=0,microsecond=0)
print(d.strftime("%Y-%m-%dT%H:%M:%SZ"))
PY
)
  if (( RANDOM % 100 < 45 )); then rb="Jaimie Thomas"; else rb="Staff Member"; fi
  desc="$cat observed during class period"
  curl -sS -X POST "$BASE/api/incidents" -H "Content-Type: application/json" -H "X-District-Id: $DISTRICT_ID" -d "{
    \"studentId\":$sid,
    \"category\":\"$cat\",
    \"description\":\"$desc\",
    \"severity\":\"$sev\",
    \"reportedBy\":\"$rb\",
    \"occurredAt\":\"$when\"
  }" >/dev/null
done

echo "{\"districtId\":$DISTRICT_ID,\"schoolId\":$SCHOOL_ID,\"adminId\":$ADMIN_ID,\"teacherId\":$TEACHER_ID}"
