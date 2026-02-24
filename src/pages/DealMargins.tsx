import { deals } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, Briefcase, ArrowUpRight, UserCheck, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getHandoversByDeal } from "@/lib/handover-store";

const formatCurrency = (n: number) => "₹" + (n / 100000).toFixed(1) + "L";

const DealMargins = () => {
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);

  const totalRevenue = deals.reduce((s, d) => s + d.totalContractValue, 0);
  const totalCost = deals.reduce((s, d) => s + d.totalCreatorCost, 0);
  const totalMargin = totalRevenue - totalCost;
  const avgMargin = (totalMargin / totalRevenue * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Deal & Margin Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Auto-calculated margins at every level</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contract Value" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatCard label="Total Creator Cost" value={formatCurrency(totalCost)} icon={DollarSign} />
        <StatCard label="Gross Margin" value={formatCurrency(totalMargin)} change={`${avgMargin}% overall`} changeType="positive" icon={TrendingUp} />
        <StatCard label="Active Deals" value={String(deals.length)} icon={Briefcase} />
      </div>

      {/* Deals */}
      <div className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="stat-card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedDeal(expandedDeal === deal.id ? null : deal.id)}
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-foreground">{deal.dealName}</p>
                  <p className="text-xs text-muted-foreground">{deal.clientName} · {deal.accountManager} · {deal.studio}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-mono uppercase text-muted-foreground">Revenue</p>
                  <p className="font-mono text-foreground">{formatCurrency(deal.totalContractValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono uppercase text-muted-foreground">Cost</p>
                  <p className="font-mono text-muted-foreground">{formatCurrency(deal.totalCreatorCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono uppercase text-muted-foreground">Margin</p>
                  <p className="font-mono text-success">{deal.grossMarginPercent}%</p>
                </div>
                <StatusBadge status={deal.status} />
                <ArrowUpRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedDeal === deal.id ? "rotate-90" : ""}`} />
              </div>
            </div>

            {expandedDeal === deal.id && (
              <div className="mt-4 pt-4 border-t border-border overflow-x-auto animate-fade-in space-y-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {["Creator", "Role", "Pay Model", "Rate", "Volume", "Cost", "Billing", "Margin", "Margin %"].map(h => (
                        <th key={h} className="pb-3 text-xs font-mono uppercase tracking-wider text-muted-foreground pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deal.deployedCreators.map((c) => (
                      <tr key={c.creatorId} className="data-table-row">
                        <td className="py-2.5 font-medium text-foreground pr-4">{c.creatorName}</td>
                        <td className="py-2.5 text-muted-foreground pr-4">{c.role}</td>
                        <td className="py-2.5 text-muted-foreground pr-4">{c.payModel}</td>
                        <td className="py-2.5 font-mono text-foreground pr-4">₹{c.payRate.toLocaleString()}</td>
                        <td className="py-2.5 font-mono text-muted-foreground pr-4">{c.expectedVolume.toLocaleString()}</td>
                        <td className="py-2.5 font-mono text-muted-foreground pr-4">{formatCurrency(c.totalCost)}</td>
                        <td className="py-2.5 font-mono text-foreground pr-4">{formatCurrency(c.clientBilling)}</td>
                        <td className="py-2.5 font-mono text-success pr-4">{formatCurrency(c.grossMargin)}</td>
                        <td className="py-2.5 font-mono text-success pr-4">{c.grossMarginPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Handed-over Creators */}
                {(() => {
                  const handovers = getHandoversByDeal(deal.id);
                  if (handovers.length === 0) return null;
                  return (
                    <div className="pt-4 border-t border-border">
                      <h4 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                        <UserCheck className="h-3.5 w-3.5" />
                        Handed-over Creators
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {handovers.map((ho) => (
                          <div key={ho.id} className="border border-border rounded-md p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-foreground">{ho.creatorName}</span>
                              {ho.pepperPortalLink && (
                                <a href={ho.pepperPortalLink} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>ID: {ho.pepperIdNumber}</span>
                              <span>{ho.paymentModel}</span>
                              <span className="font-mono">₹{ho.finalizedPay.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealMargins;
