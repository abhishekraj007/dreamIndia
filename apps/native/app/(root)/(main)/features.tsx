import { useState } from "react";
import {
  View,
  Alert,
  Image as RNImage,
  Text,
  ScrollView,
  Dimensions,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import * as ImagePicker from "expo-image-picker";
import { Button, Card, Spinner, useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ZoomableImage } from "@/components/zoomable-image";
import { Header, LiquidGlassButton } from "@/components";
import { useRouter } from "expo-router";
import { Bell, PiIcon, UploadCloud, User } from "lucide-react-native";

const StyledIonicons = withUniwind(Ionicons);

const { width: screenWidth } = Dimensions.get("window");
const GRID_GAP = 8;
const GRID_PADDING = 16;
const GRID_ITEM_SIZE = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

// Sample images for the ZoomableImage demo
const DEMO_IMAGES = [
  {
    id: "1",
    uri: "https://picsum.photos/seed/starter1/800/600",
    label: "Landscape",
  },
];

export default function FeaturesScreen() {
  const router = useRouter();

  const accentFg = useThemeColor("accent-foreground");
  const defaultFg = useThemeColor("default-foreground");
  const fg = useThemeColor("foreground");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploads = useQuery(api.uploads.listUserUploads, {});
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrlWithUser);
  const syncMetadata = useMutation(api.uploads.syncMetadata);
  const deleteUpload = useMutation(api.uploads.deleteUpload);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;
    try {
      setIsUploading(true);
      const result = await generateUploadUrl({});
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const uploadResponse = await fetch(result.url, {
        method: "PUT",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error("Upload failed");
      await syncMetadata({ key: result.key });
      Alert.alert("Success", "Image uploaded successfully!");
      setSelectedImage(null);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    Alert.alert("Delete File", "Are you sure you want to delete this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUpload({ key });
          } catch {
            Alert.alert("Error", "Failed to delete file");
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImageFile = (contentType: string) => contentType.startsWith("image/");

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingHorizontal: GRID_PADDING,
      }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View className="py-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-4xl font-bold text-foreground">Features</Text>
            <Text className="text-sm text-muted">
              Explore ready-to-use components included in this starter.
            </Text>
          </View>

          {/* ── Zoomable Images ── */}
          <Card>
            <Card.Body className="gap-4">
              <View className="gap-1">
                <Card.Title>Zoomable Images</Card.Title>
                <Text className="text-xs text-muted">
                  Tap any image to open a fullscreen viewer. Pinch to zoom,
                  double-tap, or swipe to close.
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: GRID_GAP,
                }}
              >
                {DEMO_IMAGES.map((item) => (
                  <View key={item.id}>
                    <ZoomableImage
                      source={{ uri: item.uri }}
                      style={{
                        width: GRID_ITEM_SIZE,
                        height: GRID_ITEM_SIZE,
                        borderRadius: 12,
                      }}
                      contentFit="cover"
                      transition={150}
                    />
                    <Text className="text-xs text-muted text-center mt-1">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Body>
          </Card>

          {/* ── File Uploads ── */}
          <Card>
            <Card.Body className="gap-4">
              <View className="gap-1">
                <Card.Title>File Uploads</Card.Title>
                <Text className="text-xs text-muted">
                  Upload and manage files with Cloudflare R2.
                </Text>
              </View>

              {selectedImage && (
                <View className="rounded-xl overflow-hidden">
                  <RNImage
                    source={{ uri: selectedImage }}
                    className="w-full h-48"
                    resizeMode="cover"
                  />
                </View>
              )}

              <View className="gap-3">
                <Button
                  variant="secondary"
                  onPress={pickImage}
                  isDisabled={isUploading}
                >
                  <StyledIonicons
                    name="images-outline"
                    size={18}
                    className="text-accent-soft-foreground"
                  />
                  <Button.Label>Select Image</Button.Label>
                </Button>

                <Button
                  variant="primary"
                  onPress={uploadImage}
                  isDisabled={!selectedImage || isUploading}
                >
                  {isUploading ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    <>
                      <StyledIonicons
                        name="cloud-upload-outline"
                        size={18}
                        className="text-accent-foreground"
                      />
                      <Button.Label>Upload</Button.Label>
                    </>
                  )}
                </Button>
              </View>
            </Card.Body>
          </Card>

          {/* Uploads list */}
          <Card>
            <Card.Body className="gap-4">
              <View className="flex-row items-center justify-between">
                <Card.Title>Your Uploads</Card.Title>
                <Text className="text-sm text-muted">
                  {uploads?.length || 0} files
                </Text>
              </View>

              {uploads === undefined ? (
                <View className="py-8 items-center">
                  <Spinner size="lg" />
                </View>
              ) : uploads === null ? (
                <View className="py-8 items-center gap-2">
                  <StyledIonicons
                    name="lock-closed-outline"
                    size={48}
                    className="text-muted opacity-50"
                  />
                  <Text className="text-muted text-center">
                    Please sign in to view your uploads
                  </Text>
                </View>
              ) : uploads.length === 0 ? (
                <View className="py-8 items-center gap-2">
                  <StyledIonicons
                    name="cloud-upload-outline"
                    size={48}
                    className="text-muted opacity-50"
                  />
                  <Text className="text-muted text-center">
                    No files uploaded yet
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {uploads.map((upload) => (
                    <Card key={upload._id} variant="secondary">
                      {isImageFile(upload.contentType) && upload.url ? (
                        <ZoomableImage
                          source={{ uri: upload.url }}
                          style={{
                            width: "100%",
                            height: 192,
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                          }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View className="w-full h-48 bg-surface-quaternary rounded-t-xl items-center justify-center">
                          <StyledIonicons
                            name="document-outline"
                            size={48}
                            className="text-muted"
                          />
                        </View>
                      )}

                      <Card.Body className="gap-2">
                        <View className="flex-row items-start justify-between gap-2">
                          <View className="flex-1 gap-1">
                            <Text
                              className="text-sm font-medium text-foreground"
                              numberOfLines={1}
                            >
                              {upload.key.split("/").pop()}
                            </Text>
                            <Text className="text-xs text-muted">
                              {formatFileSize(upload.contentLength)}
                            </Text>
                            <Text className="text-xs text-muted">
                              {new Date(upload.uploadedAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <Button
                            variant="danger-soft"
                            size="sm"
                            isIconOnly
                            onPress={() => handleDelete(upload.key)}
                          >
                            <Button.Label>
                              <StyledIonicons
                                name="trash-outline"
                                size={16}
                                className="text-danger"
                              />
                            </Button.Label>
                          </Button>
                        </View>
                      </Card.Body>
                    </Card>
                  ))}
                </View>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="gap-4">
              <Card.Title>Buttons</Card.Title>
              <View className="gap-3">
                <LiquidGlassButton variant="primary" fullWidth>
                  <Text style={{ color: accentFg }}>Primary</Text>
                </LiquidGlassButton>
                <LiquidGlassButton variant="secondary" fullWidth>
                  <Bell size={18} color={defaultFg} />
                  <Text style={{ color: defaultFg }}>Secondary</Text>
                </LiquidGlassButton>
                <LiquidGlassButton variant="tertiary" fullWidth>
                  <User size={18} color={fg} />
                  <Text style={{ color: fg }}>Tertiary</Text>
                </LiquidGlassButton>
                <LiquidGlassButton variant="outline" fullWidth>
                  <User size={18} color={fg} />
                  <Text style={{ color: fg }}>Outline</Text>
                </LiquidGlassButton>
              </View>
            </Card.Body>
          </Card>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}
