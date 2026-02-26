import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  onClick?: () => void;
}

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon, onClick }: StatCardProps) {
  return (
    <div className={`stat-card animate-fade-in ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-xl font-semibold font-mono text-foreground">{value}</p>
          {change && (
            <p className={`mt-0.5 text-[11px] font-medium ${
              changeType === "positive" ? "text-success" : 
              changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-md bg-primary/10 p-1.5">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
    </div>
  );
}
