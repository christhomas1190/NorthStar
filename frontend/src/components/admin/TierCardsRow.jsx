import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

export default function TierCardsRow() {
  const tierCards = [
    { name: "Tier 1", desc: "Universal supports", bgColor: "#e8f5ee", textColor: "#2d8c5b", badge: "success" },
    { name: "Tier 2", desc: "Targeted small-group supports", bgColor: "#fdf3e3", textColor: "#c97a20", badge: "warning" },
    { name: "Tier 3", desc: "Intensive individualized supports", bgColor: "#fbeaea", textColor: "#c0392b", badge: "danger" },
  ];

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {tierCards.map((t) => (
        <Card key={t.name} style={{ background: t.bgColor, borderColor: t.bgColor }}>
          <CardHeader style={{ borderBottomColor: "rgba(0,0,0,0.06)" }}>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: t.textColor }}>
              <Tag size={16} /> {t.name}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm" style={{ color: t.textColor, opacity: 0.85 }}>{t.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={t.badge}>Examples</Badge>
              <Badge variant={t.badge}>Entry Criteria</Badge>
              <Badge variant={t.badge}>Progress Monitor</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
