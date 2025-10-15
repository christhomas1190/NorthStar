import React, { useState, useEffect } from "react";

export default function DefineBehaviorCategories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: "", severity: "", tier: "Tier 1", description: "" });

  useEffect(() => {
    fetch("/api/behavior-categories").then(r => r.json()).then(setCategories);
  }, []);
  async function addCategory(e) {
      e.preventDefault();
      const res = await fetch("/api/behavior-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCat),
      });
      const saved = await res.json();
      setCategories([...categories, saved]);
      setNewCat({ name: "", severity: "", tier: "Tier 1", description: "" });
    }
