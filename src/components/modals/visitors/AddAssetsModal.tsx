import React, { useState, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  Portal,
  Dialog,
  RadioGroup,
  HStack,
  Button,
  Icon,
  useBreakpointValue,
} from "@chakra-ui/react";
import { FiCamera, FiTrash2, FiUpload } from "react-icons/fi";
import Image from "next/image";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  takePhotoWithSizeLimit,
  compressFileToMaxSize,
} from "@/utils/imageCompression";
import {
  uploadVisitorAssetImage,
  getVisitorAssetImageBlob,
} from "@/app/api/visitor-assets/routes";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

export type AddAssetsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSave?: (asset: {
    name: string;
    serial: string;
    type: string;
    image?: File | null;
    imagePath?: string | null;
  }) => void;
};

const AddAssetsModal: React.FC<AddAssetsModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSave,
}) => {
  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [type, setType] = useState<string>("Company");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });

  // TODO: Replace with color mode logic if available in Chakra v3 headless
  const bg = "white";
  // const border = "gray.200";

  const handleClose = () => {
    setName("");
    setSerial("");
    setType("Company");
    setImage(null);
    setImagePreview(null);
    setImagePath(null);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (onBack) onBack();
    else handleClose();
  };

  const handleSave = () => {
    if (onSave) onSave({ name, serial, type, image, imagePath });
    handleClose();
  };

  const handleImageCapture = async (file: File) => {
    setImage(file);
    setError(null);
    setUploading(true);

    try {
      // Upload the image and get the file path
      const uploadResult = await uploadVisitorAssetImage("temp", 0, file);

      if (uploadResult.success && uploadResult.data?.filePath) {
        // Store the file path
        setImagePath(uploadResult.data.filePath);

        // Get blob URL for preview
        const blobUrl = await getVisitorAssetImageBlob(
          uploadResult.data.filePath
        );
        if (blobUrl) {
          setImagePreview(blobUrl);
        } else {
          // Fallback to object URL if blob fails
          const url = URL.createObjectURL(file);
          setImagePreview(url);
        }
      } else {
        throw new Error(uploadResult.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
      // Fallback to object URL for preview
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } finally {
      setUploading(false);
    }
  };

  const handleImageDelete = async () => {
    setImage(null);
    setImagePreview(null);
    setImagePath(null);
    setError(null);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle camera capture
  const handleCameraCapture = async () => {
    if (uploading) return;

    setError(null);
    setUploading(true);

    try {
      // Check if we're on mobile (Capacitor) or web
      const capacitor = (
        window as unknown as {
          Capacitor?: { isNativePlatform?: () => boolean };
        }
      ).Capacitor;
      const isCapacitor =
        typeof window !== "undefined" &&
        capacitor &&
        capacitor.isNativePlatform &&
        capacitor.isNativePlatform();

      if (isCapacitor) {
        // Use Capacitor Camera for mobile with automatic compression
        const compressedFile = await takePhotoWithSizeLimit(15);
        await handleImageCapture(compressedFile);
      } else {
        // Use web camera API
        await captureWebCamera();
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please allow camera permissions.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else if (err.message.includes("User cancelled")) {
          // User cancelled, don't show error
          return;
        } else {
          setError("Failed to capture image. Please try again.");
        }
      } else {
        setError("Failed to capture image. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Web camera capture function
  const captureWebCamera = async () => {
    // Create a modal for camera preview
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
    `;

    const video = document.createElement("video");
    video.style.cssText = `
      width: 90%;
      max-width: 500px;
      height: auto;
      border-radius: 10px;
      pointer-events: none;
    `;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 10px;
      pointer-events: auto;
    `;

    const captureBtn = document.createElement("button");
    captureBtn.textContent = "Capture";
    captureBtn.style.cssText = `
      padding: 12px 24px;
      background: #8A38F5;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      pointer-events: auto;
      user-select: none;
      transition: background-color 0.2s;
    `;

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `
      padding: 12px 24px;
      background: #6B7280;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      pointer-events: auto;
      user-select: none;
      transition: background-color 0.2s;
    `;

    // Add hover effects
    captureBtn.addEventListener("mouseenter", () => {
      captureBtn.style.background = "#7A2FE5";
    });
    captureBtn.addEventListener("mouseleave", () => {
      captureBtn.style.background = "#8A38F5";
    });

    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background = "#4B5563";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background = "#6B7280";
    });

    buttonContainer.appendChild(captureBtn);
    buttonContainer.appendChild(cancelBtn);
    modal.appendChild(video);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);

    try {
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      video.srcObject = stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(true);
        video.onerror = () => reject(new Error("Video failed to load"));
      });

      // Capture image when button is clicked
      await new Promise((resolve, reject) => {
        captureBtn.onclick = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx?.drawImage(video, 0, 0);

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                try {
                  // Create JPG file from blob
                  const jpgFile = new File(
                    [blob],
                    `asset_photo_${Date.now()}.jpg`,
                    {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    }
                  );

                  // Compress the file if needed before uploading
                  const compressedFile = await compressFileToMaxSize(
                    jpgFile,
                    15
                  );

                  await handleImageCapture(compressedFile);
                } catch (uploadErr) {
                  console.error("Upload error:", uploadErr);
                  setError("Failed to process image");
                }
              }
              resolve(true);
            },
            "image/jpeg",
            0.9
          );
        };

        cancelBtn.onclick = () => {
          reject(new Error("User cancelled"));
        };
      });
    } finally {
      // Cleanup
      try {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
        if (modal && modal.parentNode) {
          document.body.removeChild(modal);
        }
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  };

  // Convert image to JPG format
  const convertToJpg = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img") as HTMLImageElement;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const jpgFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );
              resolve(jpgFile);
            } else {
              reject(new Error("Failed to convert image to JPG"));
            }
          },
          "image/jpeg",
          0.9
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection (fallback for file upload)
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Note: File size validation removed - compression will handle large files

    setError(null);
    setUploading(true);

    try {
      // Convert to JPG format
      const jpgFile = await convertToJpg(file);
      
      // Compress the file if needed before uploading
      const compressedFile = await compressFileToMaxSize(jpgFile, 15);
      
      await handleImageCapture(compressedFile);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to process image");
    }
  };

  // Handle camera capture click
  const handleCameraClick = () => {
    if (uploading) return;
    handleCameraCapture();
  };

  // Handle file input click (fallback)
  const handleFileInputClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
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
            className="max-w-sm"
            w={{ base: "90%", md: "400px" }}
            maxH={{ base: "85vh", md: "auto" }}
            m={{ base: "16px", md: "auto" }}
            mt={{ base: "5vh", md: "auto" }}
            mb={{ base: "5vh", md: "auto" }}
            bg={bg}
            borderRadius="lg"
            boxShadow="lg"
            tabIndex={0}
            aria-label="Add Asset Modal"
            p={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
          >
            <Dialog.Header
              p={{ base: `${modalPadding} ${contentPadding}`, md: "24px 32px" }}
              bg={{
                base: "#F4EDFE",
                md: "linear-gradient(135deg, #8A38F5, #5F24AC)",
              }}
              borderBottomWidth="1px"
              borderBottomColor={{
                base: "gray.200",
                md: "rgba(255,255,255,0.1)",
              }}
              borderTopLeftRadius="lg"
              borderTopRightRadius="lg"
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
                  Add Asset
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body
              className="modal-content"
              flex="1"
              overflowY="auto"
              minH="0"
              style={{
                overscrollBehavior: "contain",
              }}
            >
              <Box
                as="form"
                className="flex flex-col gap-4 h-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                {/* Asset Name */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    mb={1}
                    color="black"
                    aria-label="Asset Name Label"
                  >
                    Asset Name
                  </Text>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter asset name"
                    aria-label="Asset Name"
                    tabIndex={0}
                    required
                    color="black"
                  />
                </Box>
                {/* Serial/Asset Number */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    mb={1}
                    color="black"
                    aria-label="Serial Number Label"
                  >
                    Serial/Asset Number
                  </Text>
                  <Input
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="Enter serial or asset number"
                    aria-label="Serial or Asset Number"
                    tabIndex={0}
                    color="black"
                  />
                </Box>
                {/* Asset Type */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    mb={1}
                    color="black"
                    aria-label="Asset Type Label"
                  >
                    Asset Type
                  </Text>
                  <RadioGroup.Root
                    value={type}
                    onValueChange={(e) => setType(e.value ?? "Company")}
                    orientation="horizontal"
                    aria-label="Asset Type"
                  >
                    <HStack gap={4} mt={2}>
                      <RadioGroup.Item value="Company">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator
                          boxSize="24px"
                          borderRadius="full"
                          borderWidth="2px"
                          borderColor={
                            type === "Company" ? "#8A38F5" : "gray.300"
                          }
                          bg={type === "Company" ? "#8A38F5" : "white"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.2s"
                        >
                          {type === "Company" && (
                            <Box boxSize="8px" borderRadius="full" bg="white" />
                          )}
                        </RadioGroup.ItemIndicator>
                        <RadioGroup.ItemText color="#18181B" ml={2}>
                          <Text color="black">Company</Text>
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="Personal">
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator
                          boxSize="24px"
                          borderRadius="full"
                          borderWidth="2px"
                          borderColor={
                            type === "Personal" ? "#8A38F5" : "gray.300"
                          }
                          bg={type === "Personal" ? "#8A38F5" : "white"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          transition="all 0.2s"
                        >
                          {type === "Personal" && (
                            <Box boxSize="8px" borderRadius="full" bg="white" />
                          )}
                        </RadioGroup.ItemIndicator>
                        <RadioGroup.ItemText color="#18181B" ml={2}>
                          <Text color="black">Personal</Text>
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    </HStack>
                  </RadioGroup.Root>
                </Box>
                {/* Asset Image Upload */}
                <Box>
                  <Text fontSize="sm" fontWeight="500" color="gray.700" mb={3}>
                    Asset Photo
                  </Text>

                  <Flex direction="column" align="center" gap={4}>
                    {/* Image Preview Container with Delete Button */}
                    <Box
                      position="relative"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box
                        w="120px"
                        h="120px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="2px solid"
                        borderColor={imagePreview ? "green.300" : "gray.200"}
                      >
                        {imagePreview ? (
                          <Image
                            src={imagePreview}
                            alt="Asset"
                            width={120}
                            height={120}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <Flex direction="column" align="center" gap={2}>
                            <Icon as={FiCamera} boxSize={8} color="gray.400" />
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              textAlign="center"
                            >
                              No Image
                            </Text>
                          </Flex>
                        )}
                      </Box>
                      {/* Delete button positioned smoothly on circular boundary */}
                      {imagePreview && (
                        <Button
                          position="absolute"
                          top="15px"
                          right="15px"
                          size="sm"
                          bg="red.500"
                          color="white"
                          borderRadius="full"
                          w="24px"
                          h="24px"
                          minW="24px"
                          p={0}
                          onClick={handleImageDelete}
                          disabled={uploading}
                          _hover={{ bg: "red.600" }}
                          zIndex={10}
                          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                          transform="translate(50%, -50%)"
                        >
                          <Icon as={FiTrash2} boxSize={3} />
                        </Button>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Flex gap={2} direction="column" w="full">
                      {/* Camera Button */}
                      <Button
                        onClick={handleCameraClick}
                        disabled={uploading}
                        bg="#8A38F5"
                        color="white"
                        size="sm"
                        _hover={{
                          bg: "#7A2FE5",
                        }}
                        loading={uploading}
                        loadingText="Capturing..."
                        w="full"
                      >
                        <Icon as={FiCamera} mr={2} />
                        {imagePreview ? "Retake Photo" : "Take Photo"}
                      </Button>

                      {/* File Upload Button */}
                      <Button
                        onClick={handleFileInputClick}
                        disabled={uploading}
                        variant="outline"
                        size="sm"
                        borderColor="#8A38F5"
                        color="#8A38F5"
                        _hover={{
                          bg: "#8A38F5",
                          color: "white",
                        }}
                        w="full"
                      >
                        <Icon as={FiUpload} mr={2} />
                        Choose from Gallery
                      </Button>
                    </Flex>

                    {/* Error Message */}
                    {error && (
                      <Text color="red.500" fontSize="sm" textAlign="center">
                        {error}
                      </Text>
                    )}

                    {/* Hidden File Input */}
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      display="none"
                    />
                  </Flex>
                </Box>
              </Box>
            </Dialog.Body>
            <Box
              px={{ base: contentPadding, md: "32px" }}
              pb={{ base: contentPadding, md: "24px" }}
              pt={{ base: 2, md: 4 }}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius="lg"
              borderBottomRightRadius="lg"
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
                  onClick={handleBack}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                >
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSave}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                  bg="linear-gradient(135deg, #8A38F5, #5F24AC)"
                  _hover={{
                    bg: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                    transform: { base: "none", md: "translateY(-1px)" },
                  }}
                  transition="all 0.2s ease"
                  disabled={!name}
                >
                  Save
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddAssetsModal;
