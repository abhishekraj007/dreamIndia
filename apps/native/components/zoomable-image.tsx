import { useState, useCallback, useRef } from "react";
import {
  Pressable,
  StyleProp,
  ImageStyle,
  ViewStyle,
  Modal,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import { Image, ImageSource, ImageContentPosition } from "expo-image";
import {
  Zoomable,
  type ZoomableRef,
} from "@likashefqet/react-native-image-zoom";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Button } from "heroui-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ZoomableImageProps {
  source: ImageSource;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  contentPosition?: ImageContentPosition;
  transition?: number;
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  onLoad?: () => void;
  onError?: () => void;
  disabled?: boolean;
}

/**
 * ZoomableImage — tap to open fullscreen viewer with pinch-to-zoom,
 * double-tap zoom, and swipe-to-close (only when not zoomed in).
 */
export function ZoomableImage({
  source,
  style,
  containerStyle,
  contentFit = "cover",
  contentPosition,
  transition = 200,
  cachePolicy = "memory-disk",
  onLoad,
  onError,
  disabled = false,
}: ZoomableImageProps) {
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const isZoomedRef = useRef(false);
  const insets = useSafeAreaInsets();
  const zoomableRef = useRef<ZoomableRef>(null);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (!disabled) {
      translateY.value = 0;
      opacity.value = 0;
      setIsZoomed(false);
      isZoomedRef.current = false;
      setIsViewerVisible(true);
      requestAnimationFrame(() => {
        opacity.value = withTiming(1, { duration: 200 });
      });
    }
  }, [disabled, translateY, opacity]);

  const closeModal = useCallback(() => {
    setIsViewerVisible(false);
    setIsZoomed(false);
    isZoomedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 }, () => {
      scheduleOnRN(closeModal);
    });
  }, [opacity, closeModal]);

  const updateZoomState = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
    isZoomedRef.current = zoomed;
  }, []);

  const getImageUri = (): string => {
    if (typeof source === "string") return source;
    if (typeof source === "object" && source !== null && "uri" in source) {
      return source.uri || "";
    }
    return "";
  };

  const imageUri = getImageUri();

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (!isZoomedRef.current) {
        translateY.value = e.translationY;
        opacity.value = Math.max(0.5, 1 - Math.abs(e.translationY) / 400);
      }
    })
    .onEnd((e) => {
      if (!isZoomedRef.current && Math.abs(e.translationY) > 100) {
        opacity.value = withTiming(0, { duration: 150 });
        translateY.value = withTiming(
          e.translationY > 0 ? screenHeight : -screenHeight,
          { duration: 150 },
          () => {
            scheduleOnRN(closeModal);
          },
        );
      } else {
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={containerStyle}
        disabled={disabled}
      >
        <Image
          source={source}
          style={style}
          contentFit={contentFit}
          contentPosition={contentPosition}
          transition={transition}
          cachePolicy={cachePolicy}
          onLoad={onLoad}
          onError={onError}
        />
      </Pressable>

      {imageUri ? (
        <Modal
          visible={isViewerVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={handleClose}
        >
          <StatusBar barStyle="light-content" backgroundColor="black" />
          <GestureDetector gesture={panGesture}>
            <Animated.View style={{ flex: 1 }}>
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "black",
                  },
                  animatedBackgroundStyle,
                ]}
              />
              <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
                <Zoomable
                  ref={zoomableRef}
                  minScale={1}
                  maxScale={5}
                  doubleTapScale={3}
                  isSingleTapEnabled
                  isDoubleTapEnabled
                  onInteractionStart={() => updateZoomState(true)}
                  onResetAnimationEnd={() => updateZoomState(false)}
                  onDoubleTap={(zoomType) => {
                    updateZoomState(zoomType === "ZOOM_IN");
                  }}
                  onProgrammaticZoom={(zoomType) => {
                    updateZoomState(zoomType === "ZOOM_IN");
                  }}
                  style={{ flex: 1 }}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={{ width: screenWidth, height: screenHeight }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </Zoomable>
              </Animated.View>

              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: insets.top + 8,
                    right: 16,
                    zIndex: 100,
                  },
                  animatedBackgroundStyle,
                ]}
              >
                <Button
                  variant="tertiary"
                  size="sm"
                  isIconOnly
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                  onPress={handleClose}
                >
                  <X size={24} color="#fff" />
                </Button>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </Modal>
      ) : null}
    </>
  );
}

export default ZoomableImage;
