import type { Metadata } from "next";
import TransmittalClient  from "./TransmittalClient";

export const metadata: Metadata = { title: "Transmittal" };

export default function TransmittalPage() {
  return <TransmittalClient />;
}
