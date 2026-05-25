import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | TaskFlow",
  description: "View and manage all your team projects.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
