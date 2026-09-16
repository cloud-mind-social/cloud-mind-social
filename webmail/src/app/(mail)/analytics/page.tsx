"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analytics, type EmailAnalytics, type LoginAnalytics, type OverviewAnalytics } from "@/lib/api";
import { useRequireAdmin } from "@/lib/use-admin";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

const RANGES = [7, 30, 90] as const;

function shortDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone?: "danger" }) {
  return (
    <div className="rounded-sm border border-hairline bg-paper-raised px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <p className={cn("mt-1 font-display text-3xl", tone === "danger" ? "text-danger" : "text-ink")}>{value}</p>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--paper-raised)",
  border: "1px solid var(--hairline)",
  borderRadius: 2,
  fontSize: 12,
  color: "var(--ink)",
};

export default function AnalyticsPage() {
  const { me, loading } = useRequireAdmin();
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [emailByDay, setEmailByDay] = useState<EmailAnalytics | null>(null);
  const [loginsByDay, setLoginsByDay] = useState<LoginAnalytics | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading || !me) return;
    setDataLoading(true);
    Promise.all([analytics.overview(range), analytics.email(range, "day"), analytics.logins(range)])
      .then(([o, e, l]) => {
        setOverview(o);
        setEmailByDay(e);
        setLoginsByDay(l);
      })
      .finally(() => setDataLoading(false));
  }, [loading, me, range]);

  if (loading || !me) {
    return (
      <div className="flex h-full items-center justify-center text-ink-faint">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="fade-in h-full overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl text-ink">Analytics</h1>
            <p className="mt-1 text-sm text-ink-soft">Logins and email activity across the organization.</p>
          </div>
          <div className="flex gap-1 rounded-sm border border-hairline p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                  range === r ? "bg-accent text-paper" : "text-ink-soft hover:bg-paper-raised",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {dataLoading || !overview ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-5 w-5 text-ink-faint" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Active users" value={`${overview.users.active}/${overview.users.total}`} />
              <StatTile label="Sent" value={overview.email.sent} />
              <StatTile label="Received" value={overview.email.received} />
              <StatTile
                label="Bounced / rejected"
                value={overview.email.bounced + overview.email.rejected}
                tone={overview.email.bounced + overview.email.rejected > 0 ? "danger" : undefined}
              />
            </div>

            <div className="mt-8 rounded-sm border border-hairline bg-paper-raised p-5">
              <h2 className="mb-4 font-display text-lg text-ink">Email volume</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={emailByDay?.series as { day: string; sent: number; received: number }[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={shortDay}
                    stroke="var(--ink-faint)"
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: "var(--hairline)" }}
                    tickLine={false}
                  />
                  <YAxis stroke="var(--ink-faint)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => shortDay(String(v))} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
                  <Area
                    type="monotone"
                    dataKey="received"
                    name="Received"
                    stroke="var(--accent)"
                    fill="var(--accent-soft)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sent"
                    name="Sent"
                    stroke="var(--brass)"
                    fill="var(--brass-soft)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 rounded-sm border border-hairline bg-paper-raised p-5">
              <h2 className="mb-4 font-display text-lg text-ink">Logins</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={loginsByDay?.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={shortDay}
                    stroke="var(--ink-faint)"
                    tick={{ fontSize: 11 }}
                    axisLine={{ stroke: "var(--hairline)" }}
                    tickLine={false}
                  />
                  <YAxis stroke="var(--ink-faint)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => shortDay(String(v))} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--ink-soft)" }} />
                  <Bar dataKey="ok" name="Successful" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="var(--danger)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-hidden rounded-sm border border-hairline">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-paper-raised text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                    <th className="px-4 py-2.5">Person</th>
                    <th className="px-4 py-2.5 text-right">Logins ok</th>
                    <th className="px-4 py-2.5 text-right">Logins failed</th>
                    <th className="px-4 py-2.5">Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {loginsByDay?.byUser.map((u) => (
                    <tr key={u.userId} className="border-b border-hairline/60 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-ink">{u.displayName}</td>
                      <td className="px-4 py-2.5 text-right text-ink-soft">{u.ok}</td>
                      <td className={cn("px-4 py-2.5 text-right", u.failed > 0 ? "text-danger" : "text-ink-soft")}>
                        {u.failed}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-ink-faint">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}
                      </td>
                    </tr>
                  ))}
                  {loginsByDay?.byUser.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">
                        No login activity in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
