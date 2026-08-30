import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-screen bg-ink">{children}</div>;
}
