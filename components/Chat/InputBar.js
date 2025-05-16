import React from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { ActivityIndicator } from "react-native-paper";
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
  // Debug scrollRef
  React.useEffect(() => {
    if (!scrollRef) {
      console.warn("InputBar: scrollRef is undefined");
    }
  }, [scrollRef]);

  return (
    <>
      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <EmojiSelector
            onEmojiSelected={(emoji) => {
              setMessage((prev) => prev + emoji);
              setShowEmojiPicker(false);
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
          >
            <MaterialIcons name="insert-emoticon" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPickImage} style={styles.inputIcon}>
            <MaterialIcons name="photo" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPickDocument} style={styles.inputIcon}>
            <MaterialIcons name="attach-file" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleRecording}
            style={styles.inputIcon}
          >
            <MaterialIcons
              name={isRecording ? "stop" : "mic"}
              size={24}
              color={isRecording ? "#ff0000" : "#666"}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          multiline
          keyboardType="default"
          autoCorrect={false}
          onFocus={() => {
            onTyping();
            setShowEmojiPicker(false);
            if (scrollRef?.current) {
              setTimeout(
                () => scrollRef.current.scrollToEnd({ animated: true }),
                300
              );
            } else {
              console.warn(
                "InputBar: Cannot scroll, scrollRef.current is undefined"
              );
            }
          }}
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={onSend}
          disabled={
            isSending || (!message.trim() && !selectedMedia && !selectedFile)
          }
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
    height: 200,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});

export default InputBar;
