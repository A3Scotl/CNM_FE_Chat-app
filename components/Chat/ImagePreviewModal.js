import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Portal, Modal } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const ImagePreviewModal = ({ visible, imageUrl, onDismiss }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      lastScale.current = event.nativeEvent.scale;
      scale.setValue(event.nativeEvent.scale);
    }
  };

  const resetScale = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    lastScale.current = 1;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          onDismiss();
          resetScale();
        }}
        contentContainerStyle={styles.imagePreviewModal}
      >
        <View style={styles.imagePreviewContainer}>
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <Animated.Image
              source={{ uri: imageUrl }}
              style={[
                styles.fullSizeImage,
                {
                  transform: [{ scale }],
                },
              ]}
              resizeMode="contain"
            />
          </PinchGestureHandler>
          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={() => {
              onDismiss();
              resetScale();
            }}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  imagePreviewModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
    zIndex:10000
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "100%",
    height: "80%",
  },
  closePreviewButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});

export default ImagePreviewModal;