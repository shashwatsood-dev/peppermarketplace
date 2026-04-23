import type { RequisitionStatus, CreatorStatus } from "@/lib/mock-data";

const statusStyles: Record<string, string> = {
  "Yet to start": "bg-info/15 text-info",
  "In progress": "bg-info/15 text-info",
  "RMG approval Pending": "bg-warning/15 text-warning",
  "Approved but not assigned": "bg-primary/15 text-primary",
  "On hold": "bg-warning/15 text-warning",
  "Scrapped": "bg-destructive/15 text-destructive",
  "Closed – allotment pending": "bg-accent/15 text-accent",
  "Closed – allotted": "bg-success/15 text-success",
  "Active": "bg-success/15 text-success",
  "Inactive": "bg-muted text-muted-foreground",
  "Blacklisted": "bg-destructive/15 text-destructive",
  "Preferred": "bg-primary/15 text-primary",
  "Draft": "bg-muted text-muted-foreground",
  "Submitted": "bg-info/15 text-info",
};

interface StatusBadgeProps {
  status: RequisitionStatus | CreatorStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${statusStyles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}
