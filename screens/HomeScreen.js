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
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Appbar, Avatar, useTheme, BottomNavigation, Portal, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ConversationList from "../components/ConversationList";
import ProfileModal from "../components/Modal/ProfileModal";
import SettingsModal from "../components/Modal/SettingsModal";
import DropdownMenu from "../components/DropdownMenu";
import SearchBar from "../components/SearchBar";
import ContactsScreen from "./ContactsScreen";
import { getMyProfile, findUserByPhone } from "../apis/user.api";
import { logout } from "../apis/auth.api";
import { useFriendRequest } from "../hooks/useFriendRequest";
import { createGroup } from "../apis/conversationGroup.api";
import { getFriends } from "../apis/contact.api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const colors = { ...theme.colors, primary: "#0098f9", accent: "#0098f9" };

  const [currentUser, setCurrentUser] = useState(null); 
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
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [loadingGroupSearch, setLoadingGroupSearch] = useState(false);
  const [loadingSendRequest, setLoadingSendRequest] = useState(false);
  const [loadingCreateGroup, setLoadingCreateGroup] = useState(false);

  const routes = [
    { key: "messages", title: "Messages", icon: "message-text" },
    { key: "contacts", title: "Contacts", icon: "account-group" },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setCurrentUser({
        ...profile,
        token: route.params?.user?.token || (await AsyncStorage.getItem("token")),
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const data = await getFriends();
      setFriends(data || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchFriends();
  }, [fetchProfile, fetchFriends]);

  const handleProfileUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      setLoadingLogout(true);
      setShowDropdown(false);
      await logout();
      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoadingLogout(false);
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
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleGroupSearch = useCallback(
    debounce(async (query) => {
      const formattedQuery = query.replace(/[^0-9]/g, "");
      if (!formattedQuery.trim()) {
        setGroupSearchResults([]);
        return;
      }
      try {
        setLoadingGroupSearch(true);
        const results = await findUserByPhone(formattedQuery);
        const resultsArray = Array.isArray(results) ? results : [results];
        setGroupSearchResults(resultsArray);
      } catch (error) {
        console.error("Group search error:", error);
        setGroupSearchResults([]);
      } finally {
        setLoadingGroupSearch(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleGroupSearchChange = (query) => {
    setGroupSearchQuery(query);
    handleGroupSearch(query);
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      setLoadingSendRequest(true);
      await sendRequest(receiverId);
      Alert.alert("Thành công", "Lời mời kết bạn đã được gửi!");
      setMessage("Lời mời kết bạn đã được gửi!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMsg =
        error.message === "Friend request already exists"
          ? "Lời mời kết bạn đã được gửi trước đó!"
          : "Không thể gửi lời mời kết bạn.";
      setMessage(errorMsg);
      setTimeout(() => setMessage(""), 3000);
      console.error("Error sending friend request:", error);
    } finally {
      setLoadingSendRequest(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedMembers.length < 2) {
      Alert.alert("Lỗi", "Nhóm phải có ít nhất 2 thành viên");
      return;
    }

    try {
      setLoadingCreateGroup(true);
      const groupData = {
        name: groupName,
        members: selectedMembers,
      };
      const response = await createGroup(groupData);
      setShowCreateGroupModal(false);
      setGroupName("");
      setSelectedMembers([]);
      setGroupSearchQuery("");
      setGroupSearchResults([]);
      // Alert.alert("Thành công", "Nhóm đã được tạo!");
      navigation.navigate("Chat", {
        conversationId: response.data.group._id,
        chat: {
          _id: response.data.group._id,
          user: { fullName: response.data.group.name, avatar: response.data.group.avatar },
          type: "group",
        },
        user: currentUser,
      });
    } catch (error) {
      console.error("Error creating group:", error?.response?.data || error);
      const errorMsg = error?.response?.data?.message || "Không thể tạo nhóm, vui lòng thử lại.";
      Alert.alert("Lỗi", errorMsg);
    } finally {
      setLoadingCreateGroup(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;

    return (
      <View style={styles.searchOverlay}>
        {isSearching ? (
          <Text style={styles.searchingText}>Đang tìm kiếm...</Text>
        ) : searchResults.length > 0 ? (
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
                      {item.fullName || "Người dùng không xác định"}
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
          />
        ) : (
          <Text style={styles.noResults}>Không tìm thấy người dùng.</Text>
        )}
      </View>
    );
  };

  const renderGroupModal = () => (
    <Portal>
      <Modal
        visible={showCreateGroupModal}
        onDismiss={() => setShowCreateGroupModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Tạo nhóm mới</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Nhập tên nhóm"
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={styles.modalInput}
          placeholder="Tìm kiếm theo số điện thoại"
          value={groupSearchQuery}
          onChangeText={handleGroupSearchChange}
        />
        {groupSearchResults.length > 0 && (
          <FlatList
            data={groupSearchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleMember(item._id)}
              >
                <Avatar.Image
                  size={40}
                  source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName}</Text>
                  <Text style={styles.userPhone}>{item.phoneNumber}</Text>
                </View>
                <MaterialCommunityIcons
                  name={selectedMembers.includes(item._id) ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            style={styles.searchResults}
          />
        )}
        <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => toggleMember(item._id)}
            >
              <Avatar.Image
                size={40}
                source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.fullName}</Text>
                <Text style={styles.userPhone}>{item.phoneNumber}</Text>
              </View>
              <MaterialCommunityIcons
                name={selectedMembers.includes(item._id) ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
          style={styles.friendsList}
        />
        <View style={styles.modalButtons}>
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            style={styles.modalButton}
          >
            Tạo nhóm
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowCreateGroupModal(false)}
            style={styles.modalButton}
          >
            Hủy
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderScene = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    if (!currentUser?._id) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Lỗi: Không thể tải thông tin người dùng.</Text>
        </View>
      );
    }
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
          <ConversationList currentUser={currentUser} />
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
            <TouchableOpacity
              style={styles.groupIcon}
              onPress={() => setShowCreateGroupModal(true)}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={30}
                color="white"
              />
            </TouchableOpacity>
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
      {renderSearchResults()}
      {renderGroupModal()}
      <View style={{ flex: 1, minHeight: 550 }}>{renderScene()}</View>
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
              <View style={[styles.iconContainer]}>
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
    justifyContent: "space-between",
  },
  groupIcon: {
    marginLeft:10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    marginLeft: 5,
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
    width: 30,
    height: 30,
  },
  searchOverlay: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: 20,
    elevation: 20,
    padding: 10,
  },
  searchingText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#0098f9",
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
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 100,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    paddingTop:70,
    textAlign:'center',
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  modalInput: {
    marginHorizontal:20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    paddingHorizontal:30,
    paddingVertical:5
  },
  searchResults: {
    maxHeight: 150,
    marginBottom: 10,
    paddingHorizontal:30

  },
  friendsList: {
    paddingHorizontal:30
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom:50
  },
});

export default HomeScreen;