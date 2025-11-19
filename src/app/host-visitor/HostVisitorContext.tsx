"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface HostVisitorFormData {
  fullName: string;
  phone: string;
  gender: string;
  date: string;
  time: string;
  purpose: string;
  comingFrom: string;
  companyName: string;
  location: string;
  status: string;
  hostDetails: {
    userId: number;
    email: string;
    name: string;
    phoneNumber: string;
    profileImageUrl: string | null;
  };
}

interface HostVisitorContextType {
  hostVisitorData: HostVisitorFormData | null;
  setHostVisitorData: (data: HostVisitorFormData | null) => void;
  visitorId: string | null;
  setVisitorId: (id: string | null) => void;
}

const HostVisitorContext = createContext<HostVisitorContextType | undefined>(undefined);

export const useHostVisitor = () => {
  const context = useContext(HostVisitorContext);
  if (context === undefined) {
    throw new Error("useHostVisitor must be used within a HostVisitorProvider");
  }
  return context;
};

interface HostVisitorProviderProps {
  children: ReactNode;
}

export const HostVisitorProvider: React.FC<HostVisitorProviderProps> = ({ children }) => {
  const [hostVisitorData, setHostVisitorData] = useState<HostVisitorFormData | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  return (
    <HostVisitorContext.Provider value={{ hostVisitorData, setHostVisitorData, visitorId, setVisitorId }}>
      {children}
    </HostVisitorContext.Provider>
  );
}; 