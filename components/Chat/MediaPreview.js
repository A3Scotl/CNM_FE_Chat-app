import React from "react";
import { View, Image, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const MediaPreview = ({ selectedMedia, selectedFile, onCancel, onRemoveMediaItem }) => {
  if (!selectedMedia.length && !selectedFile) return null;

  return (
    <View style={styles.previewContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {selectedMedia.map((media, index) => (
          <View key={index} style={styles.previewItem}>
            <Image source={{ uri: media.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveMediaItem(media.uri)}
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ))}
        {selectedFile && (
          <View style={styles.previewItem}>
            <View style={styles.filePlaceholder}>
              <MaterialIcons name="insert-drive-file" size={40} color="#666" />
            </View>
            <TouchableOpacity style={styles.removeButton} onPress={onCancel}>
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  previewItem: {
    marginRight: 10,
    position: "relative",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  filePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
});

export default MediaPreview;