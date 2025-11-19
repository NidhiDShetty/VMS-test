"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Portal,
  Dialog,
  useBreakpointValue,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import PreviewModal from "./PreviewModal";

// Add CSS styles for phone input focus states
const phoneInputStyles = `
  .phone-input-focus-normal:focus {
    border-color: #8A38F5 !important;
    box-shadow: 0 0 0 1px #8A38F5 !important;
  }
  .phone-input-focus-error:focus {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 1px #ef4444 !important;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = phoneInputStyles;
  document.head.appendChild(styleElement);
}
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteModal = ({ isOpen, onClose }: InviteModalProps) => {
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<string>("in");
  const [email, setEmail] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({
    companyName: "",
    phoneNumber: "",
    email: "",
    phoneCountry: "in",
    country: "Ind",
  });

  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);

  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });

  // Field-level validation
  const validateCompanyName = (value: string) => {
    if (!value.trim()) return "Company name is required";
    if (value.trim().length < 2)
      return "Company name must be at least 2 characters";
    return "";
  };

  const validatePhoneNumber = (value: string) => {
    if (!value.trim()) return "Phone number is required";
    if (value.trim().length < 10)
      return "Phone number must be at least 10 digits";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim()))
      return "Please enter a valid email address";
    return "";
  };

  const checkCompanyNameExists = async (companyName: string) => {
    const authDataRaw = localStorage.getItem("authData");
    const authData = authDataRaw ? JSON.parse(authDataRaw) : {};
    const token = authData?.token || "";

    const response = await fetch(
      `${FRONTEND_URL}/api/companies/check-name/?name=${encodeURIComponent(
        companyName
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data.exists;
  };

  const handlePreview = async () => {
    // Validate all fields
    const cErr = validateCompanyName(companyName);
    const pErr = validatePhoneNumber(phoneNumber);
    const eErr = validateEmail(email);
    setCompanyNameError(cErr);
    setPhoneNumberError(pErr);
    setEmailError(eErr);

    if (cErr || pErr || eErr) return;

    setLoading(true);
    try {
      // Check for duplicate company name before proceeding
      const exists = await checkCompanyNameExists(companyName);
      if (exists) {
        setCompanyNameError("Company name already exists");
        setLoading(false);
        return;
      }

      // Set preview data and show preview modal
      setPreviewData({
        companyName,
        phoneNumber,
        email,
        phoneCountry,
        country: "Ind",
      });

      setLoading(false);
      setShowPreview(true);
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
      }
      setLoading(false);

      if (errorMsg.includes("Company name already exists")) {
        setCompanyNameError("Company name already exists");
      } else {
        toaster.error({
          title: "Failed to check company name",
          description: errorMsg,
        });
      }
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setCompanyName("");
    setPhoneNumber("");
    setEmail("");
    setCompanyNameError("");
    setPhoneNumberError("");
    setEmailError("");
    setShowPreview(false);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
  };

  const handlePreviewBack = () => {
    setShowPreview(false);
  };

  return (
    <>
      {/* Add Company Details Modal - Hidden when preview is shown */}
      {!showPreview && (
        <Dialog.Root
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
        >
          <Portal>
            <Dialog.Backdrop
              bg="rgba(0, 0, 0, 0.5)"
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={1000}
            />
            <Dialog.Positioner
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={{ base: 3, md: 4 }}
              zIndex={1001}
              overflow="hidden"
              overscrollBehavior="none"
              className="modal-container"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "hidden",
                overscrollBehavior: "none",
              }}
            >
              <Dialog.Content
                width="full"
                maxWidth={{ base: "100%", md: "600px" }}
                height="full"
                maxHeight={{ base: "100%", md: "calc(100vh - 2rem)" }}
                borderRadius={{ base: "none", md: "xl" }}
                bg="white"
                boxShadow={{
                  base: "0 2px 16px rgba(95,36,172,0.27)",
                  md: "0 2px 16px rgba(95,36,172,0.27)",
                }}
                tabIndex={0}
                aria-label="Add Company Details Modal"
                p={0}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                overflow="hidden"
                border={{ base: "none", md: "1px solid" }}
                borderColor={{
                  base: "transparent",
                  md: "rgba(139, 92, 246, 0.1)",
                }}
                position="relative"
              >
                <Dialog.Header
                  p={{
                    base: `${modalPadding} ${contentPadding}`,
                    md: "24px 32px",
                  }}
                  bg={{
                    base: "#F4EDFE",
                    md: "linear-gradient(135deg, #8A38F5, #5F24AC)",
                  }}
                  borderBottomWidth="1px"
                  borderBottomColor={{
                    base: "gray.200",
                    md: "rgba(255,255,255,0.1)",
                  }}
                  borderTopLeftRadius={{ base: 0, md: "xl" }}
                  borderTopRightRadius={{ base: 0, md: "xl" }}
                  position="sticky"
                  top={0}
                  zIndex={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow={{
                    base: "none",
                    md: "0 4px 20px rgba(139, 92, 246, 0.2)",
                  }}
                  h={{ base: "70px", md: "auto" }}
                >
                  <Dialog.Title asChild>
                    <Text
                      fontWeight="bold"
                      fontSize={{ base: "lg", md: "xl" }}
                      color={{ base: "gray.800", md: "white" }}
                      textAlign="center"
                      fontFamily="Roboto, sans-serif"
                    >
                      Add Company Details
                    </Text>
                  </Dialog.Title>
                </Dialog.Header>

                <Box
                  as={Dialog.Body}
                  p={{ base: contentPadding, md: "32px" }}
                  flex={1}
                  minH={0}
                  overflowY="scroll"
                  overflowX="hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  className="scrollbar-hide modal-content"
                  bg="white"
                  position="relative"
                  maxH="calc(100vh - 200px)"
                  overscrollBehavior="contain"
                >
                  <Flex
                    direction="column"
                    mb="16px"
                    gap={{ base: 4, md: 6 }}
                    pt={{ base: 2, md: 4 }}
                  >
                    {/* Company Name */}
                    <Box>
                      <Text
                        fontWeight="medium"
                        fontSize={{ base: "sm", md: "md" }}
                        color="#000"
                        mb={{ base: 1, md: 2 }}
                        fontFamily="Roboto, sans-serif"
                      >
                        Company Name
                      </Text>
                      <Input
                        value={companyName}
                        onChange={(e) => {
                          setCompanyName(e.target.value);
                          if (companyNameError) {
                            setCompanyNameError(
                              validateCompanyName(e.target.value)
                            );
                          }
                        }}
                        placeholder="Enter company name"
                        borderColor={companyNameError ? "red.500" : "gray.200"}
                        borderRadius="lg"
                        borderWidth="1px"
                        h="40px"
                        fontSize={{ base: "sm", md: "md" }}
                        _focus={{
                          borderColor: companyNameError ? "red.500" : "#8A38F5",
                          boxShadow: companyNameError
                            ? "0 0 0 1px #ef4444"
                            : "0 0 0 1px #8A38F5",
                        }}
                        _active={{
                          borderColor: companyNameError ? "red.500" : "#8A38F5",
                        }}
                        _hover={{
                          borderColor: companyNameError ? "red.400" : "#8A38F5",
                        }}
                        transition="all 0.2s ease-in-out"
                      />
                      {companyNameError && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {companyNameError}
                        </Text>
                      )}
                    </Box>

                    {/* Phone Number */}
                    <Box>
                      <Text
                        fontWeight="medium"
                        fontSize={{ base: "sm", md: "md" }}
                        color="#000"
                        mb={{ base: 1, md: 2 }}
                        fontFamily="Roboto, sans-serif"
                      >
                        Phone Number
                      </Text>
                      <PhoneInput
                        country={phoneCountry}
                        value={phoneNumber}
                        onChange={(value, country) => {
                          setPhoneNumber(value);
                          setPhoneCountry(
                            (
                              country as { countryCode?: string }
                            )?.countryCode?.toLowerCase() || "in"
                          );
                          if (phoneNumberError) {
                            setPhoneNumberError(validatePhoneNumber(value));
                          }
                        }}
                        inputStyle={{
                          width: "100%",
                          height: "40px",
                          border: phoneNumberError
                            ? "1px solid #ef4444"
                            : "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        inputClass={`phone-input-focus-${
                          phoneNumberError ? "error" : "normal"
                        }`}
                        buttonStyle={{
                          border: phoneNumberError
                            ? "1px solid #ef4444"
                            : "1px solid #e2e8f0",
                          borderRadius: "8px",
                          margin: "1px",
                        }}
                        masks={{ in: ".........." }}
                      />
                      {phoneNumberError && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {phoneNumberError}
                        </Text>
                      )}
                    </Box>

                    {/* Email */}
                    <Box>
                      <Text
                        fontWeight="medium"
                        fontSize={{ base: "sm", md: "md" }}
                        color="#000"
                        mb={{ base: 1, md: 2 }}
                        fontFamily="Roboto, sans-serif"
                      >
                        Email
                      </Text>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) {
                            setEmailError(validateEmail(e.target.value));
                          }
                        }}
                        placeholder="Enter email address"
                        borderColor={emailError ? "red.500" : "gray.200"}
                        borderRadius="lg"
                        borderWidth="1px"
                        h="40px"
                        fontSize={{ base: "sm", md: "md" }}
                        _focus={{
                          borderColor: emailError ? "red.500" : "#8A38F5",
                          boxShadow: emailError
                            ? "0 0 0 1px #ef4444"
                            : "0 0 0 1px #8A38F5",
                        }}
                        _active={{
                          borderColor: emailError ? "red.500" : "#8A38F5",
                        }}
                        _hover={{
                          borderColor: emailError ? "red.400" : "#8A38F5",
                        }}
                        transition="all 0.2s ease-in-out"
                      />
                      {emailError && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {emailError}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </Box>

                <Box
                  px={{ base: contentPadding, md: "32px" }}
                  pb={{ base: contentPadding, md: "24px" }}
                  pt={{ base: 2, md: 4 }}
                  position="sticky"
                  bottom={0}
                  zIndex={2}
                  bg="white"
                  borderBottomLeftRadius={{ base: 0, md: "xl" }}
                  borderBottomRightRadius={{ base: 0, md: "xl" }}
                  borderTopWidth="1px"
                  borderTopColor={{
                    base: "gray.200",
                    md: "rgba(139, 92, 246, 0.1)",
                  }}
                  boxShadow={{
                    base: "none",
                    md: "0 -4px 20px rgba(139, 92, 246, 0.1)",
                  }}
                >
                  <Flex gap={{ base: 2, md: 4 }} w="full">
                    <SecondaryButton
                      onClick={handleClose}
                      className="flex-1"
                      w="50%"
                      // h={{ base: "40px", md: "48px" }}
                      // fontSize={{ base: "sm", md: "md" }}
                      // borderRadius={{ base: "md", md: "xl" }}
                      // fontFamily="Roboto, sans-serif"
                    >
                      Back
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={handlePreview}
                      className="flex-1"
                      w="50%"
                      // h={{ base: "40px", md: "48px" }}
                      // fontSize={{ base: "sm", md: "md" }}
                      // borderRadius={{ base: "md", md: "xl" }}
                      // fontFamily="Roboto, sans-serif"
                      // bg="linear-gradient(135deg, #8A38F5, #5F24AC)"
                      // _hover={{
                      //   bg: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                      //   transform: { base: "none", md: "translateY(-1px)" },
                      // }}
                      transition="all 0.2s ease"
                      loading={loading}
                    >
                      {loading ? "Loading..." : "Preview"}
                    </PrimaryButton>
                  </Flex>
                </Box>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}

      {/* Preview Modal - Shows when preview is clicked */}
      <PreviewModal
        isOpen={showPreview}
        onClose={handlePreviewClose}
        onBack={handlePreviewBack}
        onCloseParent={handleClose}
        companyData={previewData}
      />
    </>
  );
};

export default InviteModal;
