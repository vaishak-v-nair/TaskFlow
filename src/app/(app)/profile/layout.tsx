import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | TaskFlow",
  description: "Manage your TaskFlow account and profile settings.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
