import { FileDown, Filter, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">
            NS
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">NorthStar</h1>
          <Badge variant="secondary" className="ml-2">Desktop • v0.1</Badge>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Input placeholder="Search students, incidents…" className="w-72" />
          <Button variant="outline" className="gap-2"><Filter size={16}/>Filters</Button>
          <Button className="gap-2"><FileDown size={16}/>Export</Button>
          <Button variant="outline" className="gap-2"><ShieldCheck size={16}/>Admin</Button>
        </div>
      </div>
    </header>
  );
}