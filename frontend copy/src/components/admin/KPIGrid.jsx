import KPICard from "@/components/common/KPICard";

export default function KPIGrid({ items = [] }) {
  return (
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
    {items.map((k) => (
        <KPICard
          key={k.label}
          label={k.label}
          value={k.value}
          hint={k.hint}
          onClick={k.onClick}
        />
      ))}
    </div>
  );
}