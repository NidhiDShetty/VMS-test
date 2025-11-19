import React, { createContext, useContext, useState, ReactNode } from "react";
import { VisitorFormData } from "@/app/api/visitor/routes";

interface VisitorPreviewContextType {
  visitorPreviewData: VisitorFormData | null;
  setVisitorPreviewData: (data: VisitorFormData | null) => void;
}

const VisitorPreviewContext = createContext<VisitorPreviewContextType | undefined>(undefined);

export const VisitorPreviewProvider = ({ children }: { children: ReactNode }) => {
  const [visitorPreviewData, setVisitorPreviewData] = useState<VisitorFormData | null>(null);

  return (
    <VisitorPreviewContext.Provider value={{ visitorPreviewData, setVisitorPreviewData }}>
      {children}
    </VisitorPreviewContext.Provider>
  );
};

export const useVisitorPreview = () => {
  const context = useContext(VisitorPreviewContext);
  if (!context) {
    throw new Error("useVisitorPreview must be used within a VisitorPreviewProvider");
  }
  return context;
}; 