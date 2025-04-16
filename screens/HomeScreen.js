import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { Appbar, Avatar, useTheme, BottomNavigation } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ChatList from "../components/Chat/ChatList";
import ProfileModal from "../components/Modal/ProfileModal";
import SettingsModal from "../components/Modal/SettingsModal";
import DropdownMenu from "../components/DropdownMenu";
import ContactsScreen from "./ContactsScreen";
import SearchBar from "../components/SearchBar";
import SearchOverlay from "../components/SearchOverlay";
import { getMyProfile, findUserByPhone } from "../apis/user.api";
import { logout } from "../apis/auth.api";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { getMyConversations } from "../apis/conversation.api";

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

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setCurrentUser({
        ...profile,
        token: route.params?.user?.token,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile.");
    }
  }, []);

  // Update last message in conversation
  const handleUpdateLastMessage = (conversationId, message) => {
    setConversations((prev) =>
      prev.map((item) =>
        item._id === conversationId ? { ...item, lastMessage: message } : item
      )
    );
  };

  // Initial profile fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Fetch conversations
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

  // Profile update handler
  const handleProfileUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Logout handler
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

  // Search debounce utility
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Search handler
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
    }, 1300),
    []
  );

  // Search change handler
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // Send friend request handler
  const handleSendFriendRequest = async (receiverId) => {
    try {
      await sendRequest(receiverId);
      Alert.alert("Success", "Friend request sent!");
      setMessage("Friend request sent!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMsg =
        error.message === "Friend request already exists"
          ? "Friend request already sent!"
          : "Failed to send friend request.";
      Alert.alert("Error", errorMsg);
      setMessage(errorMsg);
      setTimeout(() => setMessage(""), 3000);
    }
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
        <View style={{ flex: 1 }}>
          <ChatList
            chats={conversations}
            onChatSelect={(chat) => {
              setSelectedChat(chat);
              setShowAppbar(false);
              setShowBottomNav(false);
            }}
          />
        </View>
      );
    }
    return <ContactsScreen style={{ flex: 1, position: "relative" }} navigation={navigation} />;
  };

  return (
    <Pressable
      onPress={() => {
        setShowDropdown(false);
        Keyboard.dismiss();
      }}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header with SearchBar */}
      {showAppbar && (
        <View style={styles.appBarContainer}>
          <Appbar.Header style={styles.appBar}>
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={handleSearchChange}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              colors={colors}
              onSearch={handleSearch}
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
      {/* Search results overlay */}
      <SearchOverlay
        isVisible={searchQuery.trim().length > 0}
        searchResults={searchResults}
        isSearching={isSearching}
        searchQuery={searchQuery}
        currentUser={currentUser}
        onSendFriendRequest={handleSendFriendRequest}
        message={message}
        colors={colors}
      />

      {/* Main content */}
      <View style={[
        { flex: 1,minHeight:550 },
        showAppbar && { marginTop: 110 }, 
      ]}>
        {renderScene()}
      </View>


      {/* Bottom navigation */}
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
                  size={30}
                  color={color}
                />
              </View>
            );
          }}
        />
      )}

      {/* Modals */}
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
  appBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
    backgroundColor: "white",
    elevation:8,
    zIndex: 10,
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  activeIconContainer: {
    // backgroundColor: "rgba(0, 152, 249, 0.1)",
    // borderRadius: 50,
    // width: 30,
    // height: 30,
  },
});

export default HomeScreen;