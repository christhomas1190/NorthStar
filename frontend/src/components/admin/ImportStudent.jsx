import React, { useMemo, useState } from "react";


const NAME_FORMATS = [
  { id: "FIRST_LAST", label: "First Last (e.g., Ada Lovelace)" },
  { id: "LAST_COMMA_FIRST", label: "Last, First (e.g., Lovelace, Ada)" },
  { id: "TSV_FIRST_LAST", label: "Tab/CSV: First  Last (columns or commas)" },
  { id: "TSV_LAST_FIRST", label: "Tab/CSV: Last  First (columns or commas)" },
];

function trimAll(x = "") {
  return x.replace(/\s+/g, " ").trim();
}

function splitCSVorTSV(line) {
  // split by tab first, else comma
  if (line.includes("\t")) return line.split("\t").map((s) => s.trim());
  if (line.includes(",")) return line.split(",").map((s) => s.trim());
  // fallback: split by multiple spaces
  return line.split(/\s{2,}|\s/).map((s) => s.trim());
}

function parseLine(line, format) {
  const raw = line.trim();
  if (!raw) return null;

  switch (format) {
      case "FIRST_LAST": {
        // "Ada Lovelace" -> ["Ada", "Lovelace"]
        const parts = raw.split(/\s+/);
        if (parts.length < 2) return null;
        const first = parts.slice(0, parts.length - 1).join(" ");
        const last = parts[parts.length - 1];
        return { firstName: trimAll(first), lastName: trimAll(last) };
        }
            case "LAST_COMMA_FIRST": {
      // "Lovelace, Ada Marie"
              const parts = raw.split(/\s+/);
              if (parts.length < 2) return null;
              const last = m[0];
              const first = m.slice(1).join(","); // keep any extra commas in first
                return { firstName: trimAll(first), lastName: trimAll(last) };
               }
}