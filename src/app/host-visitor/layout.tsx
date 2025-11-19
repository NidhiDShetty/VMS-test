"use client";

import { HostVisitorProvider } from "./HostVisitorContext";

export default function HostVisitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HostVisitorProvider>{children}</HostVisitorProvider>;
} 