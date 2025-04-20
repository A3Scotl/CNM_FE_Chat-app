import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const ReplyPreview = ({ replyingTo, onCancel }) => {
  if (!replyingTo) return null;

  const isCurrentUserReply = replyingTo.isCurrentUser;
  const senderName = isCurrentUserReply ? "Bạn" : replyingTo.sender.fullName;

  let replyContent = "";
  if (replyingTo.type === "text") {
    replyContent = replyingTo.content;
  } else if (replyingTo.type === "image") {
    replyContent = "Hình ảnh";
  } else if (replyingTo.type === "audio") {
    replyContent = "Tin nhắn âm thanh";
  } else if (replyingTo.type === "file") {
    replyContent = "Tệp đính kèm";
  }

  return (
    <View style={styles.replyPreviewContainer}>
      <View style={styles.replyPreviewContent}>
        <View
          style={[styles.replyIndicator, { backgroundColor: isCurrentUserReply ? "#0e76a8" : "#f1f1f1" }]}
        />
        <View style={styles.replyTextContainer}>
          <Text style={styles.replySenderText}>Đang trả lời {senderName}</Text>
          <Text style={styles.replyContentText} numberOfLines={1} ellipsizeMode="tail">
            {replyContent}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelReplyButton}>
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  replyPreviewContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  replyPreviewContent: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  replyIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 10,
  },
  replyTextContainer: {
    flex: 1,
  },
  replySenderText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  replyContentText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  cancelReplyButton: {
    marginLeft: 10,
  },
});

export default ReplyPreview;