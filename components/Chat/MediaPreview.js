import React, { useState } from "react";
import { View, Image, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";

const getFileExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const fileTypeIcons = {
  pdf: "picture-as-pdf",
  doc: "description",
  docx: "description",
  xls: "grid-on",
  xlsx: "grid-on",
  ppt: "slideshow",
  pptx: "slideshow",
  txt: "notes",
  default: "insert-drive-file",
};

// Component riêng cho audio
const AudioPreview = ({ file, onRemove }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    if (isPlaying) {
      await sound?.pauseAsync();
      setIsPlaying(false);
    } else {
      if (!sound) {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: file.uri });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  return (
    <View style={styles.previewItem}>
      <TouchableOpacity style={styles.audioContainer} onPress={togglePlayback}>
        <MaterialIcons name={isPlaying ? "pause-circle-filled" : "play-circle-filled"} size={40} color="#666" />
        <Text style={styles.audioText} numberOfLines={1}>{file.name}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <MaterialIcons name="close" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const MediaPreview = ({
  selectedMedia = [],
  selectedFiles = [],
  onCancel,
  onRemoveMediaItem,
  onRemoveFileItem,
}) => {
  const safeMedia = Array.isArray(selectedMedia) ? selectedMedia : [];
  const safeFiles = Array.isArray(selectedFiles) ? selectedFiles : [];

  const [imageLoadErrorUris, setImageLoadErrorUris] = useState([]);

  const handleImageError = (uri) => {
    setImageLoadErrorUris((prev) => [...prev, uri]);
  };

  if (safeMedia.length === 0 && safeFiles.length === 0) return null;

  return (
    <View style={styles.previewContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Images */}
        {safeMedia.map((media, index) => {
          const hasError = imageLoadErrorUris.includes(media.uri);
          return (
            <View key={index} style={styles.previewItem}>
              {hasError ? (
                <View style={[styles.previewImage, styles.imageError]}>
                  <MaterialIcons name="broken-image" size={40} color="#999" />
                  <Text style={styles.errorText}>Không thể tải ảnh</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: media.uri }}
                  style={styles.previewImage}
                  onError={() => handleImageError(media.uri)}
                />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveMediaItem(media.uri)}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Files (Document + Audio) */}
        {safeFiles.map((file, index) => {
          const ext = getFileExtension(file.name);
          const isAudio = file.mimeType?.startsWith("audio") || file.type?.startsWith("audio");

          if (isAudio) {
            return (
              <AudioPreview
                key={index}
                file={file}
                onRemove={() => onRemoveFileItem(file.uri)}
              />
            );
          }

          const iconName = fileTypeIcons[ext] || fileTypeIcons.default;

          return (
            <View key={index} style={styles.previewItem}>
              <View style={styles.filePlaceholder}>
                <MaterialIcons name={iconName} size={40} color="#666" />
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveFileItem(file.uri)}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          );
        })}
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
    width: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: "cover",
  },
  imageError: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
  },
  filePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  fileName: {
    marginTop: 5,
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  audioContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  audioText: {
    fontSize: 12,
    color: "#333",
    marginTop: 5,
    textAlign: "center",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
});

export default MediaPreview;
