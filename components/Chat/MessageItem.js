import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";

const MessageItem = ({ msg, user, userId, onReply, onFocus, viewRefs, playAudio }) => {
  const renderMessage = () => {
    if (msg.type === "image" && msg.fileMeta?.length > 0) {
      return (
        <TouchableOpacity onPress={() => onFocus(msg.fileMeta[0].url, true)}>
          <Image source={{ uri: msg.fileMeta[0].url }} style={styles.messageImage} resizeMode="cover" />
        </TouchableOpacity>
      );
    } else if (msg.type === "audio" && msg.fileMeta?.length > 0) {
      return (
        <TouchableOpacity style={styles.audioContainer} onPress={() => playAudio(msg.fileMeta[0].url)}>
          <FontAwesome5 name="play-circle" size={24} color={msg.isCurrentUser ? "white" : "#444"} />
          <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
            Tin nhắn âm thanh
          </Text>
        </TouchableOpacity>
      );
    } else if (msg.type === "file" && msg.fileMeta?.length > 0) {
      return (
        <View style={styles.fileContainer}>
          <FontAwesome5 name="file-alt" size={24} color={msg.isCurrentUser ? "white" : "#444"} />
          <View style={styles.fileInfo}>
            <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
              {msg.fileMeta[0].name}
            </Text>
            <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>
              {(msg.fileMeta[0].size / 1024).toFixed(2)} KB
            </Text>
          </View>
        </View>
      );
    }
    return (
      <Text style={msg.isCurrentUser ? styles.messageTextMe : styles.messageTextOther}>{msg.content}</Text>
    );
  };

  const renderReplyToMessage = () => {
    if (!msg.replyTo) return null;
    const isCurrentUserReply = String(msg.replyTo.sender?._id || msg.replyTo.sender) === String(userId);
    const senderName = isCurrentUserReply ? "Bạn" : msg.sender.fullName.split(" ").pop();

    let replyContent = "";
    if (msg.replyTo.type === "text") {
      replyContent = msg.replyTo.content;
    } else if (msg.replyTo.type === "image") {
      replyContent = "Hình ảnh";
    } else if (msg.replyTo.type === "audio") {
      replyContent = "Tin nhắn âm thanh";
    } else if (msg.replyTo.type === "file") {
      replyContent = "Tệp đính kèm";
    }

    return (
      <TouchableOpacity
        style={[styles.replyToContainer, msg.isCurrentUser ? styles.replyToContainerMe : styles.replyToContainerOther]}
        onPress={() => onFocus(msg.replyTo._id, false)}
      >
        <View
          style={[styles.replyIndicatorSmall, { backgroundColor: msg.isCurrentUser ? "white" : "#0e76a8" }]}
        />
        <View>
          <Text style={[styles.replySenderTextSmall, { color: msg.isCurrentUser ? "white" : "#0e76a8" }]}>
            {senderName}
          </Text>
          <Text
            style={[styles.replyContentTextSmall, { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {replyContent}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      ref={(ref) => (viewRefs.current[msg._id] = ref)}
      collapsable={false}
      style={[
        styles.messageContainer,
        msg.isCurrentUser ? styles.messageContainerMe : styles.messageContainerOther,
      ]}
    >
      {!msg.isCurrentUser && (
        <Avatar.Image
          size={32}
          source={{ uri: msg.sender?.avatar || "https://i.pravatar.cc/150" }}
          style={styles.messageAvatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          msg.isCurrentUser ? styles.messageMe : styles.messageOther,
          msg._id === msg.focusedMessage && styles.focusedMessage,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => msg.replyTo && onFocus(msg.replyTo._id, false)}
          onLongPress={() => onReply(msg)}
          delayLongPress={200}
        >
          {renderReplyToMessage()}
          {renderMessage()}
          <Text
            style={[
              styles.timestamp,
              { color: msg.isCurrentUser ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)" },
            ]}
          >
            {msg.timestamp}
          </Text>
        </TouchableOpacity>
      </View>
      {msg.isCurrentUser && (
        <Avatar.Image
          size={32}
          source={{ uri: user?.avatar || "https://i.pravatar.cc/150" }}
          style={styles.messageAvatar}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 8,
  },
  messageContainerMe: {
    justifyContent: "flex-end",
  },
  messageContainerOther: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: "70%",
  },
  messageMe: {
    backgroundColor: "#0e76a8",
    borderBottomRightRadius: 2,
  },
  messageOther: {
    backgroundColor: "#f1f1f1",
    borderBottomLeftRadius: 2,
  },
  messageTextMe: { color: "white" },
  messageTextOther: { color: "black" },
  timestamp: {
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  replyToContainer: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  replyToContainerMe: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  replyToContainerOther: {
    backgroundColor: "rgba(0,118,168,0.1)",
  },
  replyIndicatorSmall: {
    width: 3,
    height: 30,
    borderRadius: 2,
    marginRight: 8,
  },
  replySenderTextSmall: {
    fontWeight: "bold",
    fontSize: 12,
  },
  replyContentTextSmall: {
    fontSize: 12,
    marginTop: 2,
  },
  focusedMessage: {
    borderWidth: 2,
    borderColor: "#0098f9",
  },
});

export default MessageItem;