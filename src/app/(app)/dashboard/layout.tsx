import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TaskFlow",
  description: "View your team's task activity and overall progress.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
