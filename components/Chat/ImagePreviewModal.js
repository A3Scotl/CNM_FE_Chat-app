import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Portal, Modal } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

const ImagePreviewModal = ({ visible, imageUrl, onDismiss }) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.imagePreviewModal}
      >
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullSizeImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={onDismiss}
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