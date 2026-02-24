import type { RequisitionStatus, CreatorStatus } from "@/lib/mock-data";

const statusStyles: Record<string, string> = {
  "Draft": "bg-muted text-muted-foreground",
  "Submitted": "bg-info/15 text-info",
  "Approved": "bg-primary/15 text-primary",
  "Assigned to TA": "bg-warning/15 text-warning",
  "In Progress": "bg-info/15 text-info",
  "Shortlisting": "bg-warning/15 text-warning",
  "Client Interview": "bg-accent/15 text-accent",
  "Closed – Filled": "bg-success/15 text-success",
  "Closed – Dropped": "bg-destructive/15 text-destructive",
  "Active": "bg-success/15 text-success",
  "Inactive": "bg-muted text-muted-foreground",
  "Blacklisted": "bg-destructive/15 text-destructive",
  "Preferred": "bg-primary/15 text-primary",
  "Completed": "bg-muted text-muted-foreground",
  "On Hold": "bg-warning/15 text-warning",
  "Pending Head of Supply Review": "bg-warning/15 text-warning",
  "Rejected": "bg-destructive/15 text-destructive",
  "Approved – Assigning": "bg-primary/15 text-primary",
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
