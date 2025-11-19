"use client";
import React, { useState, ChangeEvent, useEffect, useCallback } from "react";
import { Box, Flex, Icon, Text, IconButton } from "@chakra-ui/react";
import VisitorReportCard from "./VisitorReportCard";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { visitorReport, visitorReportByHost } from "@/lib/api/visitorReports";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { Capacitor } from "@capacitor/core";
import { requestStoragePermission } from "../../../utils/permission";
import { Directory, Filesystem } from "@capacitor/filesystem";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";

type VisitorReports = {
  fromDate: string;
  toDate: string;
  reportType: string;
};

const ReportPage = () => {
  const router = useRouter();
  const [summaryStart, setSummaryStart] = useState("");
  const [summaryEnd, setSummaryEnd] = useState("");
  const [detailedStart, setDetailedStart] = useState("");
  const [detailedEnd, setDetailedEnd] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [detailedError, setDetailedError] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDetailed, setLoadingDetailed] = useState(false);

  // Utility
  const isFutureDate = useCallback((date: string) => {
    const selected = new Date(date);
    const now = new Date();
    selected.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return selected > now;
  }, []);

  const validateDates = useCallback(
    (start: string, end: string) => {
      if (!start && !end) return "Please select date range";
      if (!start) return "Please select start date";
      if (!end) return "Please select end date";
      if (new Date(end) < new Date(start))
        return "End date cannot be before start date";
      if (isFutureDate(start) || isFutureDate(end))
        return "Cannot select future dates";
      return "";
    },
    [isFutureDate]
  );

  // Clear summary error if dates become valid
  useEffect(() => {
    const error = validateDates(summaryStart, summaryEnd);
    if (!error && summaryError) {
      setSummaryError("");
    }
  }, [summaryStart, summaryEnd, summaryError, validateDates]);

  // Clear detailed error if dates become valid
  useEffect(() => {
    const error = validateDates(detailedStart, detailedEnd);
    if (!error && detailedError) {
      setDetailedError("");
    }
  }, [detailedStart, detailedEnd, detailedError, validateDates]);

  const handleDownloadSummary = () => {
    const error = validateDates(summaryStart, summaryEnd);
    setSummaryError(error);
    if (error) return;

    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;

    if (authDataRaw) {
      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;

      // Decode JWT token to get user details
      let role = "";
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decodedToken = JSON.parse(jsonPayload);
          role = decodedToken?.roleName || "";
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
        }
      }

      if (!role) {
        toaster.error({
          title: "Authentication Error",
          description: "User role not found. Please log in again.",
        });
        return;
      }

      const reportData: VisitorReports = {
        fromDate: summaryStart,
        toDate: summaryEnd,
        reportType: "summary",
      };

      downloadReport(role, token, reportData);
    } else {
      toaster.error({
        title: "Authentication Error",
        description: "Please log in to download reports.",
      });
    }
  };

  const handleDownloadDetailed = () => {
    const error = validateDates(detailedStart, detailedEnd);
    setDetailedError(error);
    if (error) return;

    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;

    if (authDataRaw) {
      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;

      // Decode JWT token to get user details
      let role = "";
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decodedToken = JSON.parse(jsonPayload);
          role = decodedToken?.roleName || "";
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
        }
      }

      if (!role) {
        toaster.error({
          title: "Authentication Error",
          description: "User role not found. Please log in again.",
        });
        return;
      }

      const reportData: VisitorReports = {
        fromDate: detailedStart,
        toDate: detailedEnd,
        reportType: "detailed",
      };

      downloadReport(role, token, reportData);
    } else {
      toaster.error({
        title: "Authentication Error",
        description: "Please log in to download reports.",
      });
    }
  };

  const parseDateString = (dateStr: string) => {
    // Expected format: dd-mm-yyyy
    const [dd, mm, yyyy] = dateStr.split("-");
    return new Date(`${yyyy}-${mm}-${dd}`);
  };

  const sortReportByDate = (data: unknown[], reportType: string) => {
    return data.sort((a, b) => {
      const aObj = a as { date?: string; visitedDate?: string };
      const bObj = b as { date?: string; visitedDate?: string };
      const dateAStr = reportType === "summary" ? aObj.date : aObj.visitedDate;
      const dateBStr = reportType === "summary" ? bObj.date : bObj.visitedDate;

      if (!dateAStr || !dateBStr) return 0;

      const dateA = parseDateString(dateAStr);
      const dateB = parseDateString(dateBStr);
      return dateA.getTime() - dateB.getTime(); // ascending order
    });
  };

  const downloadReport = async (
    role: string,
    token: string,
    reportData: VisitorReports
  ) => {
    if (reportData.reportType === "summary") {
      setLoadingSummary(true);
    }
    if (reportData.reportType === "detailed") {
      setLoadingDetailed(true);
    }

    // Extract orgId from JWT token for Admin/Security roles
    let orgId: number | null = null;
    if (token && (role === "Admin" || role === "Security")) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decodedToken = JSON.parse(jsonPayload);
        orgId = decodedToken?.orgId || null;
      } catch (decodeError) {
        console.error("Error decoding token for orgId:", decodeError);
      }
    }

    if (role == "Host") {
      try {
        const res = await visitorReportByHost(reportData, token);
        if (res?.length == 0) {
          if (reportData.reportType === "summary") {
            setLoadingSummary(false);
          }
          if (reportData.reportType === "detailed") {
            setLoadingDetailed(false);
          }
          toaster.error({
            title: "Report not found",
            description: "There are no reports available.",
          });
        } else {
          const sortedRes = sortReportByDate(res, reportData.reportType);

          // Wait for export to complete before showing success
          if (reportData.reportType === "summary") {
            await exportVisitorSummary(sortedRes);
          } else if (reportData.reportType === "detailed") {
            await exportVisitorDetailed(sortedRes);
          }

          // Only clear loading state and show success after export completes
          if (reportData.reportType === "summary") {
            setLoadingSummary(false);
          }
          if (reportData.reportType === "detailed") {
            setLoadingDetailed(false);
          }

          toaster.success({
            title: "Report download successful",
            description: "Report downloaded successfully",
          });

          // Clear dates after successful download
          if (reportData.reportType === "summary") {
            setSummaryStart("");
            setSummaryEnd("");
          } else if (reportData.reportType === "detailed") {
            setDetailedStart("");
            setDetailedEnd("");
          }
        }
      } catch (err: unknown) {
        let errorMsg = "Unknown error";
        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { error?: string } } })
            .response === "object"
        ) {
          const response = (err as { response?: { data?: { error?: string } } })
            .response;
          errorMsg = response?.data?.error || errorMsg;
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }
        if (reportData.reportType === "summary") {
          setLoadingSummary(false);
        }
        if (reportData.reportType === "detailed") {
          setLoadingDetailed(false);
        }
        toaster.error({
          title: "Failed to download report",
          description: errorMsg,
        });
      }
    }
    if (role == "SuperAdmin" || role == "Admin" || role == "Security") {
      try {
        const res = await visitorReport(reportData);

        // Filter by orgId for Admin/Security roles (SuperAdmin sees all)
        let filteredRes = res;
        if ((role === "Admin" || role === "Security") && orgId !== null) {
          filteredRes = res.filter((item: any) => {
            // For summary reports, filter by organizationId (available in response)
            if (reportData.reportType === "summary") {
              return item.organizationId === orgId;
            }
            // For detailed reports, orgId is not included in the response
            // Since we're using the same endpoint as SuperAdmin and filtering on frontend,
            // we need to check if orgId is available in any form
            // Note: Detailed report response may not include orgId, so this may not filter correctly
            // In this case, the filtering might need to be handled differently
            if (item.organizationId !== undefined) {
              return item.organizationId === orgId;
            }
            if (item.orgId !== undefined) {
              return item.orgId === orgId;
            }
            // If orgId is not available in detailed report, we can't filter
            // This is a limitation - detailed reports from visitorReport endpoint don't include orgId
            // For now, return true (don't filter) if orgId is not available
            // TODO: Consider modifying backend to include orgId in detailed report response
            return true;
          });
        }

        if (filteredRes?.length == 0) {
          if (reportData.reportType === "summary") {
            setLoadingSummary(false);
          }
          if (reportData.reportType === "detailed") {
            setLoadingDetailed(false);
          }
          toaster.error({
            title: "Report not found",
            description: "There are no reports available for your company.",
          });
        } else {
          const sortedRes = sortReportByDate(
            filteredRes,
            reportData.reportType
          );

          // Wait for export to complete before showing success
          if (reportData.reportType === "summary") {
            await exportVisitorSummary(sortedRes);
          } else if (reportData.reportType === "detailed") {
            await exportVisitorDetailed(sortedRes);
          }

          // Only clear loading state and show success after export completes
          if (reportData.reportType === "summary") {
            setLoadingSummary(false);
          }
          if (reportData.reportType === "detailed") {
            setLoadingDetailed(false);
          }

          toaster.success({
            title: "Report download successful",
            description: "Report downloaded successfully",
          });

          // Clear dates after successful download
          if (reportData.reportType === "summary") {
            setSummaryStart("");
            setSummaryEnd("");
          } else if (reportData.reportType === "detailed") {
            setDetailedStart("");
            setDetailedEnd("");
          }
        }
      } catch (err: unknown) {
        let errorMsg = "Unknown error";
        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { error?: string } } })
            .response === "object"
        ) {
          const response = (err as { response?: { data?: { error?: string } } })
            .response;
          errorMsg = response?.data?.error || errorMsg;
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }
        if (reportData.reportType === "summary") {
          setLoadingSummary(false);
        }
        if (reportData.reportType === "detailed") {
          setLoadingDetailed(false);
        }
        toaster.error({
          title: "Failed to download report",
          description: errorMsg,
        });
      }
    }
  };

  const formatDateDDMMYYYY = (date: string | Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const formatDateDDMMYYYYForExcel = (date: string | Date) => {
    let d: Date;

    if (typeof date === "string" && date.includes("-")) {
      const [day, month, year] = date.split("-").map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(date);
    }

    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  const generateUniqueFileName = async (
    baseName: string,
    ext: string
  ): Promise<string> => {
    try {
      const dir = await Filesystem.readdir({
        directory: Directory.Documents,
        path: "",
      });

      const existingFiles = dir.files.map((f) => f.name.toLowerCase());

      let index = 0;
      let fileName = `${baseName}.${ext}`.toLowerCase();

      while (existingFiles.includes(fileName)) {
        index++;
        fileName = `${baseName}(${index}).${ext}`.toLowerCase();
      }

      return index === 0
        ? `${baseName}.${ext}`
        : `${baseName}(${index}).${ext}`;
    } catch (err) {
      console.warn("Error reading directory:", err);
      return `${baseName}_${Date.now()}.${ext}`; // fallback
    }
  };
  // Your exportVisitorSummary function as you wrote it
  const exportVisitorSummary = async (summaryData: unknown[]) => {
    if (!summaryData?.length) return;

    // Sheet content
    const header = [["Visitor Summary Report"]];
    const dateRange = [
      [
        `${formatDateDDMMYYYY(summaryStart)} to ${formatDateDDMMYYYY(
          summaryEnd
        )}`,
      ],
    ];
    const columnHeaders = [
      [
        "Date",
        "In Campus",
        "Out Campus",
        "Pending",
        "Approved",
        "Rejected",
        "Company",
        "Total",
      ],
    ];
    const rows = summaryData.map((item) => {
      const summaryItem = item as {
        date: string;
        checkInCount: number;
        checkOutCount: number;
        pending: number;
        approved: number;
        rejected: number;
        organizationName: string;
        totalVisitors: number;
      };
      return [
        formatDateDDMMYYYYForExcel(summaryItem.date),
        summaryItem.checkInCount,
        summaryItem.checkOutCount,
        summaryItem.pending,
        summaryItem.approved,
        summaryItem.rejected,
        summaryItem.organizationName,
        summaryItem.totalVisitors,
      ];
    });

    const worksheetData = [
      ...header,
      [],
      ...dateRange,
      [],
      ...columnHeaders,
      ...rows,
    ];

    // Create worksheet and workbook
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    // Column widths for better readability
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 10 },
    ];

    // Apply bold and center alignment to header and date range
    const headingCell = worksheet["A1"];
    if (headingCell) {
      headingCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center" },
      };
    }

    const dateRangeCell = worksheet["A3"];
    if (dateRangeCell) {
      dateRangeCell.s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    }

    // Bold column headers (row 5)
    for (let col = 0; col < columnHeaders[0].length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
      const cell = worksheet[cellAddress];
      if (cell) {
        cell.s = {
          font: { bold: true },
          // alignment: { horizontal: "center" },
        };
      }
    }

    // Merge cells for centered title and date
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitor Summary");

    // Save to file
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
      cellStyles: true,
    });
    // const fileBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    // saveAs(fileBlob, `Visitor_Summary_${formatDateDDMMYYYY(summaryStart)}_to_${formatDateDDMMYYYY(summaryEnd)}.xlsx`);
    const fileName = `Visitor_Summary_${formatDateDDMMYYYY(
      summaryStart
    )}_to_${formatDateDDMMYYYY(summaryEnd)}.xlsx`;
    //  const baseFileName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
    //   const extension = "xlsx";
    const baseFileName = `Visitor_Summary_${formatDateDDMMYYYY(
      summaryStart
    )}_to_${formatDateDDMMYYYY(summaryEnd)}`;
    const extension = "xlsx";
    // === Platform-Specific Saving ===
    if (Capacitor.isNativePlatform()) {
      // === Android (Capacitor Mobile) ===
      const permissionGranted = await requestStoragePermission();
      if (!permissionGranted) {
        alert("Storage permission denied. Cannot save file.");
        return;
      }

      const base64Data = Buffer.from(excelBuffer).toString("base64");

      try {
        const uniqueName = await generateUniqueFileName(
          baseFileName,
          extension
        );
        await Filesystem.writeFile({
          path: uniqueName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });

        alert(`Report saved as ${uniqueName} to Documents folder`);
      } catch (err) {
        console.error("Error saving file:", err);
        alert("Failed to save file.");
      }
    } else {
      // === Web (Your original working code) ===
      const fileBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileBlob, fileName);
    }
  };

  const exportVisitorDetailed = async (detailedData: unknown[]) => {
    if (!detailedData?.length) return;
    const header = [["Visitor Detailed Report"]];
    const dateRange = [
      [
        `${formatDateDDMMYYYY(detailedStart)} to ${formatDateDDMMYYYY(
          detailedEnd
        )}`,
      ],
    ];

    // Table headers with "Whom To Meet" as a parent column (merged)
    const columnHeaderRow1 = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Whom To Meet",
      "",
      "",
      "",
    ];

    const columnHeaderRow2 = [
      "Sl. No",
      "Visited Date",
      "Visitor Name",
      "Visitor From",
      "Purpose",
      "Contact No",
      "Status",
      "In Time",
      "Out Time",
      "Duration",
      "Assets",
      "Guests",
      "Name",
      "Email",
      "Phone",
      "Requested By",
    ];

    const rows = detailedData.map((item, index) => {
      const detailedItem = item as {
        visitedDate: string;
        visitorName: string;
        visitorFrom: string;
        purpose: string;
        contactNo: string;
        status: string;
        inTime: string;
        outTime: string;
        duration: string;
        assets: string;
        guest: string;
        whomToMeet?: {
          name?: string;
          email?: string;
          phoneNumber?: string;
        };
        requestedBy?: string;
      };
      return [
        index + 1,
        formatDateDDMMYYYYForExcel(detailedItem.visitedDate),
        detailedItem.visitorName,
        detailedItem.visitorFrom,
        detailedItem.purpose,
        detailedItem.contactNo,
        detailedItem.status,
        detailedItem.inTime,
        detailedItem.outTime,
        detailedItem.duration,
        detailedItem.assets,
        detailedItem.guest,
        detailedItem.whomToMeet?.name || "",
        detailedItem.whomToMeet?.email || "",
        detailedItem.whomToMeet?.phoneNumber || "",
        detailedItem.requestedBy || "",
      ];
    });

    const worksheetData = [
      ...header,
      [],
      ...dateRange,
      [],
      columnHeaderRow1,
      columnHeaderRow2,
      ...rows,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge cells for title, date range, and "Whom To Meet" parent column
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } }, // Merge A1 to O1 (title)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 14 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 14 } }, // Merge A3 to O3 (date range)
      { s: { r: 3, c: 0 }, e: { r: 3, c: 14 } },
      { s: { r: 4, c: 11 }, e: { r: 4, c: 13 } }, // Merge L6 to N6 ("Whom To Meet")
    ];

    // Optional: Set column widths for readability
    worksheet["!cols"] = [
      { wch: 8 }, // Sl. No
      { wch: 12 }, // Date
      { wch: 20 }, // Visitor Name
      { wch: 20 }, // Visitor From
      { wch: 15 }, // Purpose
      { wch: 15 }, // Contact No
      { wch: 12 }, // Status
      { wch: 10 }, // In Time
      { wch: 10 }, // Out Time
      { wch: 10 }, // Duration
      { wch: 20 }, // Assets
      { wch: 20 }, // Guests
      { wch: 15 }, // Whom To Meet - Name
      { wch: 30 }, // Whom To Meet - Email
      { wch: 15 }, // Whom To Meet - Phone
      { wch: 20 }, // Requested By
    ];
    const headingCell = worksheet["A1"];
    if (headingCell) {
      headingCell.s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center" },
      };
    }

    const dateRangeCell = worksheet["A3"];
    if (dateRangeCell) {
      dateRangeCell.s = {
        font: { bold: true },
        alignment: { horizontal: "center" },
      };
    }

    // Bold column headers (row 5)
    for (let col = 0; col < columnHeaderRow1.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
      const cell = worksheet[cellAddress];
      if (cell) {
        cell.s = {
          font: { bold: true },
          alignment: { horizontal: "center", vertical: "center" }, // center align
        };
      }
    }
    for (let col = 0; col < columnHeaderRow2.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });
      const cell = worksheet[cellAddress];
      if (cell) {
        cell.s = {
          font: { bold: true },
          // alignment: { horizontal: "center", vertical: "center" }, // center align
        };
      }
    }
    const whomToMeetMergedCell = worksheet["L5"]; // L5 is the merged cell starting point
    if (whomToMeetMergedCell) {
      whomToMeetMergedCell.s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
    // Create and export workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitor Detailed");

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
      cellStyles: true,
    });

    // const fileBlob = new Blob([excelBuffer], {
    //   type: "application/octet-stream",
    // });

    // saveAs(fileBlob, `Visitor_Detailed_${formatDateDDMMYYYY(detailedStart)}_to_${formatDateDDMMYYYY(detailedEnd)}.xlsx`);
    const fileName = `Visitor_Detailed_${formatDateDDMMYYYY(
      detailedStart
    )}_to_${formatDateDDMMYYYY(detailedEnd)}.xlsx`;
    //  const baseFileName = fileName.replace(/\.[^/.]+$/, ""); // remove extension
    //   const extension = "xlsx";
    const baseFileName = `Visitor_Detailed_${formatDateDDMMYYYY(
      detailedStart
    )}_to_${formatDateDDMMYYYY(detailedEnd)}`;
    const extension = "xlsx";
    // === Platform-Specific Saving ===
    if (Capacitor.isNativePlatform()) {
      // === Android (Capacitor Mobile) ===
      const permissionGranted = await requestStoragePermission();
      if (!permissionGranted) {
        alert("Storage permission denied. Cannot save file.");
        return;
      }

      const base64Data = Buffer.from(excelBuffer).toString("base64");

      try {
        const uniqueName = await generateUniqueFileName(
          baseFileName,
          extension
        );
        await Filesystem.writeFile({
          path: uniqueName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });

        alert(`Report saved as ${uniqueName} to Documents folder`);
      } catch (err) {
        console.error("Error saving file:", err);
        alert("Failed to save file.");
      }
    } else {
      // === Web (Your original working code) ===
      const fileBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileBlob, fileName);
    }
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      // bg={{ base: "white", md: "#F0E6FF" }}
      bg={{ base: "white", md: "#f7f2fd" }}
      overflow={{ base: "auto", md: "hidden" }}
      position="relative"
    >
      {/* Mobile Header */}
      <Flex
        as="header"
        align="center"
        justify="center"
        w="full"
        h={{ base: "70px", md: "48px" }}
        bg="#f4edfefa"
        borderBottom="1px solid #f2f2f2"
        position="relative"
        px={0}
        display={{ base: "flex", md: "none" }}
      >
        <Box
          position="absolute"
          left={2}
          top="50%"
          transform="translateY(-50%)"
          as="button"
          tabIndex={0}
          aria-label="Go back"
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="24px"
          h="24px"
          borderRadius="full"
          bg="transparent"
          _hover={{ bg: "gray.100" }}
          p={0}
          cursor="pointer"
          onClick={() => router.push("/dashboard")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") router.push("/dashboard");
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="#18181B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">
          Reports
        </Text>
      </Flex>

      {/* Web Header */}
      <Box display={{ base: "none", md: "block" }}>
        <DesktopHeader notificationCount={3} />
      </Box>

      {/* Web Navigation Bar */}
      <Flex
        display={{ base: "none", md: "flex" }}
        align="center"
        justify="space-between"
        w="full"
        h="60px"
        // bg="#f4edfefa"
        px={6}
        py={4}
        position="fixed"
        top="70px"
        left={0}
        right={0}
        zIndex={999}
      >
        <Flex align="center" gap={3}>
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={() => router.push("/dashboard")}
            color="#8A37F7"
            _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
          >
            <FiChevronLeft />
          </IconButton>
          <Text fontSize="lg" color="#18181b" fontWeight="bold">
            Reports
          </Text>
        </Flex>
      </Flex>

      {/* Content Area */}
      <Box
        flex={1}
        overflowY="auto"
        pt={{ base: "0px", md: "60px" }}
        position="relative"
        zIndex={2}
      >
        {/* Mobile Layout */}
        <Flex
          display={{ base: "flex", md: "none" }}
          direction="column"
          w="full"
          className="h-full"
          p="16px"
        >
          <Box mb="20px">
            <VisitorReportCard
              title="Visitor Summary Report"
              description="Get a quick overview of selected date range."
              buttonLabel="Download Summary Report"
              onDownload={handleDownloadSummary}
              startDate={summaryStart}
              endDate={summaryEnd}
              onStartDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSummaryStart(e.target.value)
              }
              onEndDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSummaryEnd(e.target.value)
              }
              error={summaryError}
              isSummaryLoading={loadingSummary}
              fillHeight
            />
          </Box>
          <Box flex="1">
            <VisitorReportCard
              title="Visitor Detailed Report"
              description="Get a quick overview of selected date range."
              buttonLabel="Download Detailed Report"
              onDownload={handleDownloadDetailed}
              startDate={detailedStart}
              endDate={detailedEnd}
              onStartDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDetailedStart(e.target.value)
              }
              onEndDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDetailedEnd(e.target.value)
              }
              error={detailedError}
              isDetailedLoading={loadingDetailed}
              fillHeight
            />
          </Box>
        </Flex>

        {/* Web Layout - Side by Side */}
        <Flex
          display={{ base: "none", md: "flex" }}
          direction="row"
          w="full"
          h="calc(100vh - 130px)"
          p={6}
          gap={6}
        >
          {/* Left Side - Summary Report */}
          <Box flex={1}>
            <VisitorReportCard
              title="Visitor Summary Report"
              description="Get a quick overview of selected date range."
              buttonLabel="Download Summary Report"
              onDownload={handleDownloadSummary}
              startDate={summaryStart}
              endDate={summaryEnd}
              onStartDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSummaryStart(e.target.value)
              }
              onEndDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSummaryEnd(e.target.value)
              }
              error={summaryError}
              isSummaryLoading={loadingSummary}
              fillHeight
            />
          </Box>

          {/* Right Side - Detailed Report */}
          <Box flex={1}>
            <VisitorReportCard
              title="Visitor Detailed Report"
              description="Get a quick overview of selected date range."
              buttonLabel="Download Detailed Report"
              onDownload={handleDownloadDetailed}
              startDate={detailedStart}
              endDate={detailedEnd}
              onStartDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDetailedStart(e.target.value)
              }
              onEndDateChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDetailedEnd(e.target.value)
              }
              error={detailedError}
              isDetailedLoading={loadingDetailed}
              fillHeight
            />
          </Box>
        </Flex>
      </Box>

      {/* Decorative Background Logo */}
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        opacity={0.1}
        zIndex={1}
        pointerEvents="none"
      >
        <Box transform="scale(4)">
          <Logo />
        </Box>
      </Box>
    </Box>
  );
};

export default ReportPage;
