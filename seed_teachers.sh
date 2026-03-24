#!/bin/bash
AUTH="cthomas:Bronson1"
URL="http://localhost:8080/api/teachers"

post() {
  curl -s -u "$AUTH" -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"$1\",\"lastName\":\"$2\",\"email\":\"$3\"}"
  echo ""
}

post "Matt"   "Pricket"  "mpricket@northstar.org"
post "Pat"    "Hart"     "phart@northstar.org"
post "Jenna"  "Cook"     "jcook@northstar.org"
post "Matt"   "Heslin"   "mheslin@northstar.org"
post "Angelo" "Frangos"  "afrangos@northstar.org"
post "Elana"  "Hanson"   "ehanson@northstar.org"
post "Jody"   "Geilda"   "jgeilda@northstar.org"
post "Aimee"  "Eckert"   "aeckert@northstar.org"
post "Ryan"   "Vasquez"  "rvasquez@northstar.org"
post "Sara"   "Okonkwo"  "sokonkwo@northstar.org"
post "Derek"  "Bloom"    "dbloom@northstar.org"
post "Tanya"  "Mills"    "tmills@northstar.org"
post "Carlos" "Reyes"    "creyes@northstar.org"
post "Fiona"  "Cheng"    "fcheng@northstar.org"
post "Jordan" "Walsh"    "jwalsh@northstar.org"
post "Priya"  "Nair"     "pnair@northstar.org"
post "Ethan"  "Morse"    "emorse@northstar.org"
post "Marcus" "Reed"     "mreed@northstar.org"

echo "Done."
