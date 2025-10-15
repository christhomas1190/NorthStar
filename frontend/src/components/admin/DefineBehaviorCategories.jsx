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

return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Define Behavior Categories</h1>

      <form onSubmit={addCategory} className="grid md:grid-cols-4 gap-3">
        <input className="border rounded px-3 py-2" placeholder="Category name"
               value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })}/>
        <select className="border rounded px-3 py-2" value={newCat.severity}
                onChange={e => setNewCat({ ...newCat, severity: e.target.value })}>
          <option value="">Select severity</option>
          <option>Low</option><option>Medium</option><option>High</option>
        </select>
        <select className="border rounded px-3 py-2" value={newCat.tier}
                onChange={e => setNewCat({ ...newCat, tier: e.target.value })}>
          <option>Tier 1</option><option>Tier 2</option><option>Tier 3</option>
        </select>
        <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Description"
               value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })}/>
        <button className="bg-black text-white rounded px-4 py-2 md:col-span-2">Add Category</button>
      </form>

      <table className="min-w-full border rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr><th className="px-3 py-2 border">Name</th><th className="px-3 py-2 border">Severity</th>
              <th className="px-3 py-2 border">Tier</th><th className="px-3 py-2 border">Description</th></tr>
        </thead>
        <tbody>
          {categories.map((c, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              <td className="border px-3 py-2">{c.name}</td>
              <td className="border px-3 py-2">{c.severity}</td>
              <td className="border px-3 py-2">{c.tier}</td>
              <td className="border px-3 py-2">{c.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
