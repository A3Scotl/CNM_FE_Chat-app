import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
} from "react-native";
import {
  Appbar,
  Avatar,
  useTheme,
  BottomNavigation,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ChatList from "../components/Chat/ChatList";
import ChatArea from "../components/Chat/ChatArea";
import ProfileModal from "../components/Modal/ProfileModal";
import SettingsModal from "../components/Modal/SettingsModal";
import DropdownMenu from "../components/DropdownMenu";
import SearchBar from "../components/SearchBar";
import ContactsScreen from "./ContactsScreen";
import { getMyProfile, findUserByPhone } from "../apis/user.api";
import { logout } from "../apis/auth.api";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { useSocket } from "../hooks/useSocket";

const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const colors = { ...theme.colors, primary: "#0098f9", accent: "#0098f9" };
  const { sendRequest } = useFriendRequest();

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

  useSocket(currentUser?._id);

  const routes = [
    { key: "messages", title: "Messages", icon: "message-text" },
    { key: "contacts", title: "Contacts", icon: "account-group" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getMyProfile();
        setCurrentUser(profile);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

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
    }
  };

  const handleSearch = async (query) => {
    const formattedQuery = query.replace(/[^0-9]/g, '');
    if (!formattedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const results = await findUserByPhone(formattedQuery);
      console.log('API Results:', results);
      const resultsArray = Array.isArray(results) ? results : [results];
      setSearchResults(resultsArray);
      console.log('SearchResults state after set:', searchResults);
    } catch (error) {
      Alert.alert("Search Error", "Unable to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await sendRequest(userId);
      Alert.alert("Success", "Friend request sent!");
    } catch (error) {
      Alert.alert("Error", "Failed to send friend request.");
    }
  };

  const renderSearchResults = () => {
    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          return (
            <View style={styles.userItem}>
              <Avatar.Image
                size={40}
                source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName || "Unknown User"}</Text>
                <Text style={styles.userPhone}>{item.phoneNumber}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleSendFriendRequest(item._id)}
              >
                <MaterialCommunityIcons name="account-plus" size={24} color="#0098f9" />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={null}
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
        <View style={{ flex: 1 }}>
          <ChatList
            chats={[]}
            onChatSelect={() => { }}
          />
          {(searchResults.length > 0 && searchQuery.trim() !== '') && renderSearchResults()}
          {!isSearching && searchResults.length === 0 && searchQuery.trim() !== '' && (
            <Text style={styles.noResults}>No users found.</Text>
          )}
        </View>
      );
    }
    return <ContactsScreen />;
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setShowDropdown(false);
        Keyboard.dismiss();
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {showAppbar && (
          <View style={{ position: 'relative', zIndex: 3 }}>
            <Appbar.Header style={styles.appBar}>
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isSearchFocused={isSearchFocused}
                setIsSearchFocused={setIsSearchFocused}
                onSearch={handleSearch}
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
                    source={{ uri: currentUser?.avatar || "https://i.pravatar.cc/150" }}
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
              if (route.key === 'messages') {
                iconName = focused ? 'message-text' : 'message-text-outline';
              } else if (route.key === 'contacts') {
                iconName = focused ? 'account-group' : 'account-group-outline';
              }
              return (
                <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                  <MaterialCommunityIcons name={iconName} size={28} color={color} />
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
      </View>
    </TouchableWithoutFeedback>
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
  },
  activeIconContainer: {
    backgroundColor: "rgba(0, 152, 249, 0.1)",
    borderRadius: 20,
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
});

export default HomeScreen;