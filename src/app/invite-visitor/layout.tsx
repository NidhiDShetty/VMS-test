import { VisitorInfoProvider } from "./VisitorInfoContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <VisitorInfoProvider>
      {children}
    </VisitorInfoProvider>
  );
} 