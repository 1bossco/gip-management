import type { Metadata } from "next";
import BatchesClient      from "./BatchesClient";

export const metadata: Metadata = { title: "Batch Management" };

export default function BatchesPage() {
  return <BatchesClient />;
}
