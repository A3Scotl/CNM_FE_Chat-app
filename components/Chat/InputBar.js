import React from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import EmojiSelector from "react-native-emoji-selector";

const InputBar = ({
  message,
  setMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  isRecording,
  isSending,
  selectedMedia,
  selectedFile,
  onSend,
  onPickImage,
  onPickDocument,
  onToggleRecording,
  onTyping,
  inputRef,
  scrollRef,
}) => {
  return (
    <>
      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Chọn Emoji</Text>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(false)}
              disabled={isSending}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={isSending ? "#ccc" : "#0098f9"}
              />
            </TouchableOpacity>
          </View>
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              if (!isSending) {
                setMessage((prev) => prev + emoji);
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }}
            columns={8}
          />
        </View>
      )}
      <View style={styles.inputContainer}>
        <View style={styles.inputButtonsContainer}>
          <TouchableOpacity
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            style={styles.inputIcon}
            disabled={isSending}
          >
            <MaterialIcons
              name="insert-emoticon"
              size={24}
              color={isSending ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPickImage}
            style={styles.inputIcon}
            disabled={isSending}
          >
            <MaterialIcons
              name="photo"
              size={24}
              color={isSending ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onPickDocument}
            style={styles.inputIcon}
            disabled={isSending}
          >
            <MaterialIcons
              name="attach-file"
              size={24}
              color={isSending ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleRecording}
            style={styles.inputIcon}
            disabled={isSending}
          >
            <MaterialIcons
              name={isRecording ? "stop" : "mic"}
              size={24}
              color={isRecording ? "#ff0000" : isSending ? "#ccc" : "#666"}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={(text) => {
            if (!isSending) {
              setMessage(text);
              onTyping();
            }
          }}
          multiline
          keyboardType="default"
          autoCorrect={false}
          editable={!isSending}
          onFocus={() => {
            if (!isSending) {
              onTyping();
              setShowEmojiPicker(false);
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
            }
          }}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={isSending || (!message.trim() && !selectedMedia && !selectedFile)}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialIcons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    flexShrink: 0,
  },
  inputButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    marginLeft: 5,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#0098f9",
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  sendButtonDisabled: {
    backgroundColor: "#99CDF7",
  },
  emojiPickerContainer: {
    height: 400, 
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  emojiPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});

export default InputBar;