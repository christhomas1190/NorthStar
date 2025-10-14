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