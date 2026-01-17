#!/usr/bin/env bash

BASE_URL="http://localhost:8080"
DISTRICT_ID=1
SCHOOL_ID=1

# Format: "First|Last|email|username"
TEACHERS=(
  "Jaimie|Thomas|jaimie.thomas@northstar.org|jthomas"
  "Patrick|Hart|patrick.hart@northstar.org|phart"
  "Matthew|Heslin|matthew.heslin@northstar.org|mheslin"
  "Matt|Prickett|matt.prickett@northstar.org|mprickett"
  "Chris|Sheehan|chris.sheehan@northstar.org|csheehan"
  "Jody|Geielda|jody.geielda@northstar.org|jgeielda"
  "Angelo|Frangos|angelo.frangos@northstar.org|afrangos"
  "Elaina|Hansen|elaina.hansen@northstar.org|ehansen"
)

echo "=== Creating named teachers for district ${DISTRICT_ID}, school ${SCHOOL_ID} ==="

for t in "${TEACHERS[@]}"; do
  IFS='|' read -r FIRST LAST EMAIL USERNAME <<< "$t"

  echo "Creating teacher: ${FIRST} ${LAST} (${USERNAME})"

  curl -v -X POST "${BASE_URL}/api/teachers" \
    -H "Content-Type: application/json" \
    -H "X-District-Id: ${DISTRICT_ID}" \
    -d "{
      \"id\": null,
      \"firstName\": \"${FIRST}\",
      \"lastName\": \"${LAST}\",
      \"email\": \"${EMAIL}\",
      \"username\": \"${USERNAME}\",
      \"districtId\": ${DISTRICT_ID},
      \"schoolId\": ${SCHOOL_ID}
    }"

  echo ""
  echo "----------------------------------------"
done

echo "=== Done creating named teachers ==="
