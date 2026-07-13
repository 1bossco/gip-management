import type { Metadata } from "next";
import MonitoringClient   from "./MonitoringClient";

export const metadata: Metadata = { title: "Monitoring" };

export default function MonitoringPage() {
  return <MonitoringClient />;
}
