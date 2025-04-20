import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Text } from "react-native-paper";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const MediaPreview = ({ selectedMedia, selectedFile, onCancel }) => {
  if (selectedMedia) {
    return (
      <View style={styles.mediaPreviewContainer}>
        <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
        <TouchableOpacity style={styles.cancelMediaButton} onPress={onCancel}>
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedFile) {
    return (
      <View style={styles.filePreviewContainer}>
        <View style={styles.filePreview}>
          <FontAwesome5
            name={selectedFile.type.startsWith("audio") ? "file-audio" : "file-alt"}
            size={24}
            color="#444"
          />
          <Text style={styles.fileNameText} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          {selectedFile.size > 0 && (
            <Text style={styles.fileSizeText}>{(selectedFile.size / 1024).toFixed(2)} KB</Text>
          )}
        </View>
        <TouchableOpacity style={styles.cancelFileButton} onPress={onCancel}>
          <MaterialIcons name="close" size={18} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  mediaPreviewContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "relative",
  },
  mediaPreview: {
    height: 100,
    borderRadius: 8,
    marginRight: 50,
  },
  cancelMediaButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  filePreviewContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "relative",
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginRight: 30,
  },
  fileNameText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  fileSizeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  cancelFileButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MediaPreview;