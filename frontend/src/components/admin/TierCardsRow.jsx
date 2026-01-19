import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

export default function TierCardsRow() {
  const tierCards = [
    { name: "Tier 1", desc: "Universal supports", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Tier 2", desc: "Targeted small-group supports", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tier 3", desc: "Intensive individualized supports", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {tierCards.map((t) => (
        <Card key={t.name} className={`border ${t.color} shadow-sm`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag size={16} /> {t.name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm opacity-80">{t.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Examples</Badge>
              <Badge variant="outline">Entry Criteria</Badge>
              <Badge variant="outline">Progress Monitor</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
