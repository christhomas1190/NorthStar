import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/common/KPICard";

export default function DashboardOverviewCard({ kpis, children }) {
  return (
    <Card className="xl:col-span-2 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">School Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <KPICard key={k.label} {...k} />
          ))}
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
