import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

const Header = ({ navigation, chat, conversationDetails, groupMembers, isTyping, onInfoPress }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={24} color="#0098f9" />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={onInfoPress}
      >
        <Avatar.Image
          size={40}
          source={{
            uri:
              chat.type === "group" && conversationDetails?.avatar
                ? chat.user.avatar
                : chat?.user?.avatar || "https://i.pravatar.cc/150",
          }}
        />
        <View style={styles.headerContent}>
          <Text style={styles.chatName}>
            {chat.type === "group"
              ? chat.user?.fullName || "Nhóm không tên"
              : chat?.user?.fullName || "Không có tên"}
          </Text>
          {isTyping ? (
            <Text style={styles.statusText}>Đang nhập...</Text>
          ) : (
            <Text style={styles.statusText}>
              {chat.type === "group" ? `${groupMembers.length} thành viên` : "Trực tuyến"}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "white",
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerContent: { marginLeft: 12 },
  chatName: { fontSize: 18, fontWeight: "bold" },
  statusText: { fontSize: 12, color: "#666" },
});

export default Header;