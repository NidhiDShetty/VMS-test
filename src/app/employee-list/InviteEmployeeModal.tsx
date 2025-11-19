import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Portal,
  Dialog,
  RadioGroup,
  HStack,
} from "@chakra-ui/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  inviteEmployee,
  InviteEmployeePayload,
} from "@/app/api/invite-employees/client";
import { toaster } from "@/components/ui/toaster";

interface InviteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteEmployeeModal: React.FC<InviteEmployeeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("Security");
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      // Reset all form fields when modal is closed
      setName("");
      setPhoneNo("");
      setEmail("");
      setType("Security");
      setTouched({});
    }
  }, [isOpen]);

  // Regex for exactly 10 digits
  const phoneRegex = /^[0-9]{10}$/;
  const isPhoneValid = phoneRegex.test(phoneNo);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);

  const isNameError = touched.name && !name;

  // Name validation based on type
  const isNameValid =
    type === "Security"
      ? /^[a-zA-Z0-9\s]+$/.test(name) && name.trim().length > 0
      : /^[a-zA-Z\s]+$/.test(name) && name.trim().length > 0;


  // Separate phone error states for empty vs invalid
  const isPhoneEmpty = touched.phoneNo && !phoneNo;
  const isPhoneInvalid = touched.phoneNo && phoneNo && !isPhoneValid;
  const isPhoneError = isPhoneEmpty || isPhoneInvalid;

  // Separate email error states for empty vs invalid
  const isEmailEmpty = touched.email && !email;
  const isEmailInvalid = touched.email && email && !isEmailValid;
  const isEmailError = isEmailEmpty || isEmailInvalid;

  const isFormValid =
    !!name && isNameValid && !!isPhoneValid && !!email && !!isEmailValid;

  const handleBlur = (field: string) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const handleClose = () => {
    // Reset form when closing
    setName("");
    setPhoneNo("");
    setEmail("");
    setType("Security");
    setTouched({});
    onClose();
  };

  const handleSendInvite = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const payload: InviteEmployeePayload = { name, phoneNo, email, type };
      const res = await inviteEmployee(payload);

      // Check for success in different possible response structures
      const isSuccess =
        res.success === true ||
        res.status === "success" ||
        res.statusCode === 200 ||
        res.statusCode === 201;

      if (isSuccess) {
        toaster.create({
          type: "success",
          title: "Invite sent!",
          description: res.message || "Employee invitation sent successfully.",
          duration: 3000,
          closable: true,
        });

        // Close modal (form will be reset by useEffect)
        onClose();
      } else {
        const errorMessage =
          res.message || res.error || "Failed to send invite.";
        toaster.create({
          type: "error",
          title: "Error",
          description: errorMessage,
          duration: 3000,
          closable: true,
        });
      }
    } catch (err: unknown) {
      console.error("Error sending invite:", err); // Debug log
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send invite.";
      toaster.create({
        type: "error",
        title: "Error",
        description: errorMessage,
        duration: 3000,
        closable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendInvite();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex="1050"
        />
        <Dialog.Positioner
          className="flex items-center justify-center"
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex="1100"
        >
          <Dialog.Content
            w={{ base: "95%", md: "90%" }}
            maxW={{ base: "400px", md: "500px" }}
            maxH={{ base: "85vh", md: "calc(100vh - 32px)" }}
            bg="white"
            borderRadius={{ base: "md", md: "lg" }}
            tabIndex={0}
            aria-label="Add Employee Modal"
            p={0}
            mx="auto"
            my={{ base: "auto", md: "auto" }}
            mt={{ base: "5vh", md: "auto" }}
            mb={{ base: "5vh", md: "auto" }}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Dialog.Header p={0} m={0} mb={4}>
              <Dialog.Title asChild>
                <Box
                  bg="#8A37F7"
                  w="100%"
                  p={0}
                  m={0}
                  textAlign="center"
                  borderTopLeftRadius={{ base: "md", md: "lg" }}
                  borderTopRightRadius={{ base: "md", md: "lg" }}
                >
                  <Text
                    fontWeight="bold"
                    fontSize={{ base: "md", md: "lg" }}
                    color="white"
                    aria-label="Modal Title"
                    textAlign="center"
                    py={{ base: 2, md: 3 }}
                  >
                    Add Employee
                  </Text>
                </Box>
              </Dialog.Title>
            </Dialog.Header>
            <Box as="form" onSubmit={handleSubmit} className="flex flex-col h-full">
              <Dialog.Body 
                p={{ base: 4, md: 6 }}
                flex="1"
                overflowY="auto"
                minH="0"
              >
                <Box className="flex flex-col" gap={{ base: 3, md: 4 }}>
                  {/* Employee Name */}
                  <Box>
                    <Text
                      fontSize="sm"
                      mb={1}
                      color="black"
                      aria-label="Employee Name Label"
                    >
                      Employee Name{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Input
                      value={name}
                      onChange={(e) => {
                        const input = e.target.value;
                        // Allow alphanumeric and spaces for Security, only letters and spaces for Employee
                        const filteredInput =
                          type === "Security"
                            ? input.replace(/[^a-zA-Z0-9\s]/g, "")
                            : input.replace(/[^a-zA-Z\s]/g, "");
                        setName(filteredInput);
                      }}
                      onBlur={() => handleBlur("name")}
                      placeholder={
                        type === "Security"
                          ? "Enter Employee Name"
                          : "Enter Employee Name"
                      }
                      aria-label="Employee Name"
                      tabIndex={0}
                      required
                      color="black"
                    />
                    {isNameError && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        Employee Name is required.
                      </Text>
                    )}
                  </Box>
                  {/* Phone Number */}
                  <Box>
                    <Text
                      fontSize="sm"
                      mb={1}
                      color="black"
                      aria-label="Employee Phone Number Label"
                    >
                      Employee Phone Number{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Input
                      value={phoneNo}
                      // onChange={e => setPhoneNo(e.target.value)}
                      onChange={(e) => {
                        const input = e.target.value.replace(/\D/g, ""); // Only digits
                        if (input.length <= 10) setPhoneNo(input);
                      }}
                      onBlur={() => handleBlur("phoneNo")}
                      placeholder="Enter Phone Number"
                      aria-label="Employee Phone Number"
                      tabIndex={0}
                      required
                      color="black"
                      type="tel"
                    />
                    {isPhoneError && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        {isPhoneEmpty
                          ? "Phone Number is required."
                          : "Phone Number must be exactly 10 digits."}
                      </Text>
                    )}
                  </Box>
                  {/* Email */}
                  <Box>
                    <Text
                      fontSize="sm"
                      mb={1}
                      color="black"
                      aria-label="Employee Email Label"
                    >
                      Employee Email{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder="Enter Email"
                      aria-label="Employee Email"
                      tabIndex={0}
                      color="black"
                      type="email"
                      required
                    />
                    {isEmailError && (
                      <Text color="red.500" fontSize="xs" mt={1}>
                        {isEmailEmpty
                          ? "Email is required."
                          : "Enter valid email."}
                      </Text>
                    )}
                  </Box>
                  {/* Type */}
                  <Box>
                    <Text
                      fontSize="sm"
                      mb={1}
                      color="black"
                      aria-label="Type Label"
                    >
                      Type{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <RadioGroup.Root
                      value={type}
                      onValueChange={(e) => setType(e.value ?? "")}
                      orientation="horizontal"
                      aria-label="Type"
                    >
                      <HStack gap={8}>
                        <RadioGroup.Item value="Security">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator
                            boxSize="24px"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              type === "Security" ? "#8A38F5" : "gray.300"
                            }
                            bg={type === "Security" ? "#8A38F5" : "white"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s"
                          >
                            {type === "Security" && (
                              <Box
                                boxSize="8px"
                                borderRadius="full"
                                bg="white"
                              />
                            )}
                          </RadioGroup.ItemIndicator>
                          <RadioGroup.ItemText color="#18181B" ml={2}>
                            Security
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                        <RadioGroup.Item value="Employee">
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator
                            boxSize="24px"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              type === "Employee" ? "#8A38F5" : "gray.300"
                            }
                            bg={type === "Employee" ? "#8A38F5" : "white"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s"
                          >
                            {type === "Employee" && (
                              <Box
                                boxSize="8px"
                                borderRadius="full"
                                bg="white"
                              />
                            )}
                          </RadioGroup.ItemIndicator>
                          <RadioGroup.ItemText color="#18181B" ml={2}>
                            Employee
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      </HStack>
                    </RadioGroup.Root>
                  </Box>
                </Box>
              </Dialog.Body>
              <Dialog.Footer 
                p={{ base: 4, md: 6 }} 
                pt={0}
                flexShrink={0}
                bg="white"
                borderTop="1px solid"
                borderColor="gray.100"
              >
                <Flex w="full" gap={2}>
                  <SecondaryButton
                    w="50%"
                    ariaLabel="Back"
                    tabIndex={0}
                    type="button"
                    onClick={handleClose}
                  >
                    Back
                  </SecondaryButton>
                  <PrimaryButton
                    w="50%"
                    ariaLabel="Send Invite"
                    tabIndex={0}
                    type="submit"
                    isDisabled={!isFormValid || loading}
                    isLoading={loading}
                  >
                    Send Invite
                  </PrimaryButton>
                </Flex>
              </Dialog.Footer>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default InviteEmployeeModal;
