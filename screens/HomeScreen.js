import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
  Keyboard,
} from "react-native";
import { Appbar, Avatar, useTheme, BottomNavigation } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ChatList from "../components/Chat/ChatList";
import ProfileModal from "../components/Modal/ProfileModal";
import SettingsModal from "../components/Modal/SettingsModal";
import DropdownMenu from "../components/DropdownMenu";
import SearchBar from "../components/SearchBar";
import ContactsScreen from "./ContactsScreen";
import { getMyProfile, findUserByPhone } from "../apis/user.api";
import { logout } from "../apis/auth.api";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useSocket } from "../hooks/useSocket";
import { getMyConversations } from "../apis/conversation.api";
import ChatArea from "../components/Chat/ChatArea";

const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const colors = { ...theme.colors, primary: "#0098f9", accent: "#0098f9" };

  const [currentUser, setCurrentUser] = useState(route.params?.user || {});
  const [visibleProfile, setVisibleProfile] = useState(false);
  const [visibleSettings, setVisibleSettings] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAppbar, setShowAppbar] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [index, setIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);

  const { sendRequest } = useFriendRequest();

  const routes = [
    { key: "messages", title: "Messages", icon: "message-text" },
    { key: "contacts", title: "Contacts", icon: "account-group" },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setCurrentUser({
        ...profile,
        token: route.params?.user?.token, // giữ lại token từ route
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile.");
    }
  }, []);

  const handleUpdateLastMessage = (conversationId, message) => {
    setConversations((prev) =>
      prev.map((item) =>
        item._id === conversationId ? { ...item, lastMessage: message } : item
      )
    );
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?._id) return;

      try {
        const res = await getMyConversations();

        const mappedConversations = res.data
          .filter((convo) => convo.participants.length === 2)
          .map((convo) => {
            const other = convo.participants.find(
              (p) => p._id !== currentUser._id
            );

            return {
              _id: convo._id,
              user: other,
              lastMessage: convo.lastMessage,
            };
          });

        setConversations(mappedConversations);
      } catch (err) {
        console.error("Failed to load conversations", err);
      }
    };

    fetchConversations();
  }, [currentUser]);

  const handleProfileUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearch = useCallback(
    debounce(async (query) => {
      Keyboard.dismiss();
      const formattedQuery = query.replace(/[^0-9]/g, "");
      if (!formattedQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      try {
        setIsSearching(true);
        const results = await findUserByPhone(formattedQuery);
        const resultsArray = Array.isArray(results) ? results : [results];
        setSearchResults(resultsArray);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        Alert.alert(
          "Search Error",
          "Unable to search users. Please try again."
        );
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleSendFriendRequest = async (receiverId) => {

    try {
      await sendRequest(receiverId);
      console.log("Friend request sent successfully");
      Alert.alert("Success", "Friend request sent!");
      setMessage("Friend request sent!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMsg =
        error.message === "Friend request already exists"
          ? "Friend request already sent!"
          : "Failed to send friend request.";
      console.log("Friend request error:", errorMsg);
      Alert.alert("Error", errorMsg);
      setMessage(errorMsg);
      setTimeout(() => setMessage(""), 3000);
      console.error("Error sending friend request:", error);
    }
  };

  const renderSearchResults = () => {
    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isCurrentUser = item._id === currentUser?._id;
          return (
            <View style={styles.userItem}>
              <Avatar.Image
                size={40}
                source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {item.fullName || "Unknown User"}
                </Text>
                <Text style={styles.userPhone}>{item.phoneNumber}</Text>
              </View>
              {!isCurrentUser && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleSendFriendRequest(item._id)}
                >
                  <MaterialCommunityIcons
                    name="account-plus"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        style={styles.resultsContainer}
      />
    );
  };

  const renderScene = () => {
    if (index === 0) {
      if (selectedChat) {
        return (
          <ChatArea
            chat={selectedChat}
            onBack={() => {
              setSelectedChat(null);
              setShowAppbar(true);
              setShowBottomNav(true);
            }}
            user={currentUser}
          />
        );
      }
      return (
        <View style={{ flex: 1, position: "relative" }}>
          <ChatList chats={conversations} onChatSelect={(chat) => setSelectedChat(chat)} />
          {searchResults.length > 0 &&
            searchQuery.trim() &&
            renderSearchResults()}
          {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
            <Text style={styles.noResults}>No users found.</Text>
          )}
          {message && (
            <Text
              style={[
                styles.message,
                { color: colors.primary, backgroundColor: "#fff", padding: 10 },
              ]}
            >
              {message}
            </Text>
          )}
        </View>
      );
    }
    return <ContactsScreen navigation={navigation} />;
  };

  return (
    <Pressable
      onPress={() => {
        setShowDropdown(false);
        Keyboard.dismiss();
      }}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {showAppbar && (
        <View style={{ position: "relative", zIndex: 3 }}>
          <Appbar.Header style={styles.appBar}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              colors={colors}
            />
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
              >
                <Avatar.Image
                  size={36}
                  source={{
                    uri: currentUser?.avatar || "https://i.pravatar.cc/150",
                  }}
                  style={styles.avatar}
                />
              </TouchableOpacity>
              <DropdownMenu
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                currentUser={currentUser}
                setVisibleProfile={setVisibleProfile}
                setVisibleSettings={setVisibleSettings}
                handleLogout={handleLogout}
                colors={colors}
              />
            </View>
          </Appbar.Header>
        </View>
      )}
      <View style={{ flex: 1 }}>{renderScene()}</View>
      {showBottomNav && (
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={() => null}
          barStyle={styles.bottomNavBar}
          activeColor={colors.primary}
          inactiveColor="#888"
          labeled={false}
          sceneAnimationEnabled={true}
          sceneAnimationType="shifting"
          renderIcon={({ route, focused, color }) => {
            let iconName;
            if (route.key === "messages") {
              iconName = focused ? "message-text" : "message-text-outline";
            } else if (route.key === "contacts") {
              iconName = focused ? "account-group" : "account-group-outline";
            }
            return (
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={28}
                  color={color}
                />
              </View>
            );
          }}
          style={styles.bottomNav}
        />
      )}
      <ProfileModal
        visible={visibleProfile}
        user={currentUser}
        onDismiss={() => setVisibleProfile(false)}
        onUpdateSuccess={handleProfileUpdateSuccess}
      />
      <SettingsModal
        visible={visibleSettings}
        user={currentUser}
        onDismiss={() => setVisibleSettings(false)}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    backgroundColor: "#0098f9",
    paddingHorizontal: 10,
  },
  avatarContainer: {
    marginLeft: 10,
  },
  avatar: {
    marginLeft: 10,
  },
  bottomNavBar: {
    borderTopWidth: 0.5,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    elevation: 8,
  },
  iconContainer: {
    padding: 10,
    width:30,
    height:30,
  },

  resultsContainer: {
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    zIndex: 2,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  userPhone: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    padding: 5,
  },
  noResults: {
    textAlign: "center",
    marginVertical: 10,
    color: "#666",
    fontStyle: "italic",
  },
  message: {
    textAlign: "center",
    marginVertical: 10,
    fontSize: 14,
    position: "absolute",
    bottom: 20,
    width: "100%",
    zIndex: 10,
  },
});

export default HomeScreen;
