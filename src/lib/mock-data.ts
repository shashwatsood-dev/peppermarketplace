// Mock data for the entire application

export type RequisitionStatus = 
  | "Draft" | "Submitted" | "Approved" | "Assigned to TA" 
  | "In Progress" | "Shortlisting" | "Client Interview" 
  | "Closed – Filled" | "Closed – Dropped";

export type RoleType = "Writer" | "Editor" | "Designer" | "Video" | "Translator" | "Other";
export type StudioType = "Dedicated" | "On-demand" | "Hybrid";
export type PayModel = "Per Word" | "Per Assignment" | "Retainer" | "Hourly";
export type CreatorStatus = "Active" | "Inactive" | "Blacklisted" | "Preferred";

export interface Requisition {
  id: string;
  clientName: string;
  dealName: string;
  accountManager: string;
  studioType: StudioType;
  geography: string;
  startDate: string;
  duration: string;
  totalContractValue: number;
  talentBudget: number;
  targetMargin: number;
  billingModel: string;
  status: RequisitionStatus;
  assignedRecruiter: string | null;
  targetCloseDate: string | null;
  roles: { roleType: RoleType; count: number; seniority: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  platformId: string;
  linkedIn: string;
  category: RoleType;
  domains: string[];
  language: string;
  standardRate: number;
  negotiatedRate: number;
  payModel: PayModel;
  rating: number;
  feedbackScore: number;
  onTimePercent: number;
  lastActive: string;
  revenueGenerated: number;
  marginContribution: number;
  status: CreatorStatus;
}

export interface Deal {
  id: string;
  dealName: string;
  clientName: string;
  accountManager: string;
  studio: string;
  totalContractValue: number;
  totalCreatorCost: number;
  grossMargin: number;
  grossMarginPercent: number;
  deployedCreators: DeployedCreator[];
  status: "Active" | "Completed" | "On Hold";
}

export interface DeployedCreator {
  creatorName: string;
  creatorId: string;
  role: RoleType;
  payModel: PayModel;
  payRate: number;
  expectedVolume: number;
  totalCost: number;
  clientBilling: number;
  grossMargin: number;
  grossMarginPercent: number;
}

export const requisitions: Requisition[] = [
  {
    id: "REQ-001", clientName: "Razorpay", dealName: "Fintech Content Hub",
    accountManager: "Priya Sharma", studioType: "Dedicated", geography: "India",
    startDate: "2026-01-15", duration: "6 months", totalContractValue: 480000,
    talentBudget: 288000, targetMargin: 40, billingModel: "Retainer",
    status: "In Progress", assignedRecruiter: "Neha Gupta", targetCloseDate: "2026-02-28",
    roles: [{ roleType: "Writer", count: 3, seniority: "Senior" }, { roleType: "Editor", count: 1, seniority: "Mid" }],
    createdAt: "2026-01-10", updatedAt: "2026-02-20"
  },
  {
    id: "REQ-002", clientName: "Notion", dealName: "SaaS Blog Overhaul",
    accountManager: "Arjun Mehta", studioType: "On-demand", geography: "US",
    startDate: "2026-02-01", duration: "3 months", totalContractValue: 320000,
    talentBudget: 192000, targetMargin: 40, billingModel: "Per Asset",
    status: "Shortlisting", assignedRecruiter: "Ravi Kumar", targetCloseDate: "2026-03-05",
    roles: [{ roleType: "Writer", count: 5, seniority: "Senior" }, { roleType: "Designer", count: 2, seniority: "Mid" }],
    createdAt: "2026-01-20", updatedAt: "2026-02-22"
  },
  {
    id: "REQ-003", clientName: "Zerodha", dealName: "Investment Education Series",
    accountManager: "Priya Sharma", studioType: "Hybrid", geography: "India",
    startDate: "2026-03-01", duration: "12 months", totalContractValue: 960000,
    talentBudget: 528000, targetMargin: 45, billingModel: "Retainer",
    status: "Approved", assignedRecruiter: null, targetCloseDate: null,
    roles: [{ roleType: "Writer", count: 4, seniority: "Senior" }, { roleType: "Video", count: 2, seniority: "Senior" }, { roleType: "Editor", count: 2, seniority: "Mid" }],
    createdAt: "2026-02-05", updatedAt: "2026-02-18"
  },
  {
    id: "REQ-004", clientName: "Freshworks", dealName: "Customer Success Content",
    accountManager: "Vikram Singh", studioType: "Dedicated", geography: "US",
    startDate: "2026-02-15", duration: "6 months", totalContractValue: 540000,
    talentBudget: 324000, targetMargin: 40, billingModel: "Retainer",
    status: "Closed – Filled", assignedRecruiter: "Neha Gupta", targetCloseDate: "2026-02-10",
    roles: [{ roleType: "Writer", count: 3, seniority: "Senior" }, { roleType: "Designer", count: 1, seniority: "Senior" }],
    createdAt: "2026-01-05", updatedAt: "2026-02-10"
  },
  {
    id: "REQ-005", clientName: "Swiggy", dealName: "Brand Storytelling",
    accountManager: "Arjun Mehta", studioType: "On-demand", geography: "India",
    startDate: "2026-03-15", duration: "4 months", totalContractValue: 280000,
    talentBudget: 168000, targetMargin: 40, billingModel: "Project",
    status: "Submitted", assignedRecruiter: null, targetCloseDate: null,
    roles: [{ roleType: "Writer", count: 2, seniority: "Mid" }, { roleType: "Video", count: 1, seniority: "Senior" }],
    createdAt: "2026-02-20", updatedAt: "2026-02-20"
  },
  {
    id: "REQ-006", clientName: "Atlassian", dealName: "DevOps Documentation",
    accountManager: "Vikram Singh", studioType: "Dedicated", geography: "Australia",
    startDate: "2026-04-01", duration: "8 months", totalContractValue: 720000,
    talentBudget: 396000, targetMargin: 45, billingModel: "Retainer",
    status: "Draft", assignedRecruiter: null, targetCloseDate: null,
    roles: [{ roleType: "Writer", count: 6, seniority: "Senior" }, { roleType: "Editor", count: 2, seniority: "Senior" }],
    createdAt: "2026-02-22", updatedAt: "2026-02-22"
  },
];

export const baseCreators: Creator[] = [
  { id: "CRE-001", name: "Ananya Desai", email: "ananya@email.com", phone: "+91 98765 43210", city: "Mumbai", platformId: "PL-1001", linkedIn: "linkedin.com/in/ananya", category: "Writer", domains: ["Fintech", "SaaS"], language: "English", standardRate: 8, negotiatedRate: 7, payModel: "Per Word", rating: 4.8, feedbackScore: 92, onTimePercent: 97, lastActive: "2026-02-23", revenueGenerated: 245000, marginContribution: 98000, status: "Preferred" },
  { id: "CRE-002", name: "Rohan Kapoor", email: "rohan@email.com", phone: "+91 98765 43211", city: "Delhi", platformId: "PL-1002", linkedIn: "linkedin.com/in/rohan", category: "Writer", domains: ["Healthcare", "Wellness"], language: "English, Hindi", standardRate: 6, negotiatedRate: 5.5, payModel: "Per Word", rating: 4.5, feedbackScore: 88, onTimePercent: 94, lastActive: "2026-02-21", revenueGenerated: 178000, marginContribution: 71200, status: "Active" },
  { id: "CRE-003", name: "Megha Rao", email: "megha@email.com", phone: "+91 98765 43212", city: "Bangalore", platformId: "PL-1003", linkedIn: "linkedin.com/in/megha", category: "Designer", domains: ["SaaS", "Fintech", "Edtech"], language: "English", standardRate: 5000, negotiatedRate: 4500, payModel: "Per Assignment", rating: 4.9, feedbackScore: 96, onTimePercent: 99, lastActive: "2026-02-24", revenueGenerated: 320000, marginContribution: 128000, status: "Preferred" },
  { id: "CRE-004", name: "Karthik Nair", email: "karthik@email.com", phone: "+91 98765 43213", city: "Chennai", platformId: "PL-1004", linkedIn: "linkedin.com/in/karthik", category: "Video", domains: ["Auto", "Lifestyle"], language: "English, Tamil", standardRate: 15000, negotiatedRate: 13000, payModel: "Per Assignment", rating: 4.3, feedbackScore: 82, onTimePercent: 88, lastActive: "2026-02-15", revenueGenerated: 156000, marginContribution: 46800, status: "Active" },
  { id: "CRE-005", name: "Sanya Malhotra", email: "sanya@email.com", phone: "+91 98765 43214", city: "Pune", platformId: "PL-1005", linkedIn: "linkedin.com/in/sanya", category: "Editor", domains: ["Fintech", "SaaS", "Healthcare"], language: "English", standardRate: 4000, negotiatedRate: 3500, payModel: "Retainer", rating: 4.7, feedbackScore: 90, onTimePercent: 96, lastActive: "2026-02-22", revenueGenerated: 210000, marginContribution: 84000, status: "Active" },
  { id: "CRE-006", name: "Aditya Joshi", email: "aditya@email.com", phone: "+91 98765 43215", city: "Hyderabad", platformId: "PL-1006", linkedIn: "linkedin.com/in/aditya", category: "Writer", domains: ["Auto", "Travel"], language: "English, Marathi", standardRate: 5, negotiatedRate: 4.5, payModel: "Per Word", rating: 3.8, feedbackScore: 72, onTimePercent: 80, lastActive: "2026-01-30", revenueGenerated: 89000, marginContribution: 26700, status: "Inactive" },
  { id: "CRE-007", name: "Divya Krishnan", email: "divya@email.com", phone: "+91 98765 43216", city: "Kochi", platformId: "PL-1007", linkedIn: "linkedin.com/in/divya", category: "Writer", domains: ["SaaS", "Edtech"], language: "English, Malayalam", standardRate: 7, negotiatedRate: 6.5, payModel: "Per Word", rating: 4.6, feedbackScore: 91, onTimePercent: 95, lastActive: "2026-02-20", revenueGenerated: 198000, marginContribution: 79200, status: "Active" },
  { id: "CRE-008", name: "Varun Reddy", email: "varun@email.com", phone: "+91 98765 43217", city: "Bangalore", platformId: "PL-1008", linkedIn: "linkedin.com/in/varun", category: "Designer", domains: ["Fintech", "Healthcare"], language: "English", standardRate: 6000, negotiatedRate: 5500, payModel: "Per Assignment", rating: 4.4, feedbackScore: 85, onTimePercent: 92, lastActive: "2026-02-18", revenueGenerated: 267000, marginContribution: 93450, status: "Active" },
  { id: "CRE-009", name: "Priya Translator", email: "priya.t@email.com", phone: "+91 98765 43218", city: "Delhi", platformId: "PL-1009", linkedIn: "linkedin.com/in/priyat", category: "Translator", domains: ["Fintech", "Legal"], language: "English, Hindi, Gujarati", standardRate: 3, negotiatedRate: 2.5, payModel: "Per Word", rating: 4.2, feedbackScore: 87, onTimePercent: 93, lastActive: "2026-02-19", revenueGenerated: 95000, marginContribution: 38000, status: "Active" },
];

// getCreators is now handled in CreatorDatabase.tsx using usePods hook
// This export is kept for backward compatibility but only returns base creators
export function getCreators(): Creator[] {
  return [...baseCreators];
}

// Keep backward-compat export (computed on access)
export const creators: Creator[] = baseCreators;

export const deals: Deal[] = [
  {
    id: "DEAL-001", dealName: "Fintech Content Hub", clientName: "Razorpay",
    accountManager: "Priya Sharma", studio: "Studio Alpha", totalContractValue: 480000,
    totalCreatorCost: 288000, grossMargin: 192000, grossMarginPercent: 40, status: "Active",
    deployedCreators: [
      { creatorName: "Ananya Desai", creatorId: "CRE-001", role: "Writer", payModel: "Per Word", payRate: 7, expectedVolume: 120000, totalCost: 84000, clientBilling: 140000, grossMargin: 56000, grossMarginPercent: 40 },
      { creatorName: "Divya Krishnan", creatorId: "CRE-007", role: "Writer", payModel: "Per Word", payRate: 6.5, expectedVolume: 100000, totalCost: 65000, clientBilling: 108000, grossMargin: 43000, grossMarginPercent: 39.8 },
      { creatorName: "Sanya Malhotra", creatorId: "CRE-005", role: "Editor", payModel: "Retainer", payRate: 3500, expectedVolume: 6, totalCost: 21000, clientBilling: 36000, grossMargin: 15000, grossMarginPercent: 41.7 },
    ]
  },
  {
    id: "DEAL-002", dealName: "SaaS Blog Overhaul", clientName: "Notion",
    accountManager: "Arjun Mehta", studio: "Studio Beta", totalContractValue: 320000,
    totalCreatorCost: 192000, grossMargin: 128000, grossMarginPercent: 40, status: "Active",
    deployedCreators: [
      { creatorName: "Rohan Kapoor", creatorId: "CRE-002", role: "Writer", payModel: "Per Word", payRate: 5.5, expectedVolume: 80000, totalCost: 44000, clientBilling: 72000, grossMargin: 28000, grossMarginPercent: 38.9 },
      { creatorName: "Megha Rao", creatorId: "CRE-003", role: "Designer", payModel: "Per Assignment", payRate: 4500, expectedVolume: 20, totalCost: 90000, clientBilling: 156000, grossMargin: 66000, grossMarginPercent: 42.3 },
    ]
  },
  {
    id: "DEAL-003", dealName: "Customer Success Content", clientName: "Freshworks",
    accountManager: "Vikram Singh", studio: "Studio Alpha", totalContractValue: 540000,
    totalCreatorCost: 324000, grossMargin: 216000, grossMarginPercent: 40, status: "Active",
    deployedCreators: [
      { creatorName: "Ananya Desai", creatorId: "CRE-001", role: "Writer", payModel: "Per Word", payRate: 7, expectedVolume: 150000, totalCost: 105000, clientBilling: 175000, grossMargin: 70000, grossMarginPercent: 40 },
      { creatorName: "Varun Reddy", creatorId: "CRE-008", role: "Designer", payModel: "Per Assignment", payRate: 5500, expectedVolume: 15, totalCost: 82500, clientBilling: 140000, grossMargin: 57500, grossMarginPercent: 41.1 },
    ]
  },
];

export const taMetrics = {
  openRequisitions: 4,
  overdueRequisitions: 1,
  avgTimeToClose: 18,
  recruiterPerformance: [
    { name: "Neha Gupta", open: 2, closed: 5, avgDays: 16, profiles: { identified: 45, contacted: 38, screened: 22, shared: 14, interviewed: 8, selected: 5 } },
    { name: "Ravi Kumar", open: 2, closed: 3, avgDays: 21, profiles: { identified: 32, contacted: 25, screened: 15, shared: 10, interviewed: 6, selected: 3 } },
  ]
};

export const dashboardStats = {
  totalRevenue: 2580000,
  totalCreatorCost: 1536000,
  grossMarginPercent: 40.5,
  activeDeals: 6,
  studioBreakdown: [
    { studio: "Studio Alpha", revenue: 1020000, cost: 612000, margin: 40 },
    { studio: "Studio Beta", revenue: 860000, cost: 516000, margin: 40 },
    { studio: "Studio Gamma", revenue: 700000, cost: 408000, margin: 41.7 },
  ],
  roleMargins: [
    { role: "Writer", margin: 39.2, cost: 680000, billing: 1120000 },
    { role: "Designer", margin: 42.1, cost: 410000, billing: 708000 },
    { role: "Editor", margin: 38.5, cost: 246000, bill: 400000 },
    { role: "Video", margin: 35.8, cost: 200000, billing: 312000 },
  ],
  monthlyRevenue: [
    { month: "Sep", revenue: 380000, cost: 228000 },
    { month: "Oct", revenue: 420000, cost: 252000 },
    { month: "Nov", revenue: 445000, cost: 267000 },
    { month: "Dec", revenue: 410000, cost: 246000 },
    { month: "Jan", revenue: 460000, cost: 268000 },
    { month: "Feb", revenue: 465000, cost: 275000 },
  ],
};
