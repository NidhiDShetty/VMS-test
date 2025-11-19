"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type VisitorInfo = {
  companyName: string;
  phoneNumber: string;
  email: string;
  country: string;
  phoneCountry?: string;
  apiResult?: unknown;
};

type VisitorInfoContextType = {
  info: VisitorInfo;
  setInfo: (info: VisitorInfo) => void;
  clearStoredData: () => void;
};

const VisitorInfoContext = createContext<VisitorInfoContextType | undefined>(
  undefined
);

export const VisitorInfoProvider = ({ children }: { children: ReactNode }) => {
  const [info, setInfo] = useState<VisitorInfo>({
    companyName: "",
    phoneNumber: "",
    email: "",
    country: "Ind",
    phoneCountry: "in",
    apiResult: undefined,
  });

  const clearStoredData = () => {
    setInfo({
      companyName: "",
      phoneNumber: "",
      email: "",
      country: "Ind",
      phoneCountry: "in",
      apiResult: undefined,
    });
  };

  return (
    <VisitorInfoContext.Provider value={{ info, setInfo, clearStoredData }}>
      {children}
    </VisitorInfoContext.Provider>
  );
};

export const useVisitorInfo = () => {
  const context = useContext(VisitorInfoContext);
  if (!context)
    throw new Error("useVisitorInfo must be used within VisitorInfoProvider");
  return context;
};
