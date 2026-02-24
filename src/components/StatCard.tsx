import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function StatCard({ label, value, change, changeType = "neutral", icon: Icon }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              changeType === "positive" ? "text-success" : 
              changeType === "negative" ? "text-destructive" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
