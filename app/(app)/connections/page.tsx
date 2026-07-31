import type { Metadata } from "next";
import { ConnectionsView } from "@/components/app/connections/ConnectionsView";

export const metadata: Metadata = { title: "Connections" };

export default function ConnectionsPage() {
  return <ConnectionsView />;
}
