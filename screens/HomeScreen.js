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
import {
  Appbar,
  Avatar,
  useTheme,
  BottomNavigation,
  Portal,
  Button,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { io, Socket } from "socket.io-client";
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
import { API_URL, SOCKET_URL } from "@env";
const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const colors = { ...theme.colors, primary: "#0098f9", accent: "#0098f9" };
  const { sendRequest, fetchRequests, fetchSentRequests } = useFriendRequest();
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
  const [loading, setLoading] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedMembersDetails, setSelectedMembersDetails] = useState([]);

  const routes = [
    { key: "messages", title: "Messages", icon: "message-text" },
    { key: "contacts", title: "Contacts", icon: "account-group" },
  ];

  // Kết nối Socket.IO và lắng nghe sự kiện
  useEffect(() => {
    let socketConnection;
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");
      if (!token || !userId) {
        console.warn("Token hoặc userId không tồn tại, không thể kết nối socket");
        return;
      }

      socketConnection = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketConnection.on("connect", () => {
        console.log("✅ Socket kết nối thành công");
        socketConnection.emit("register", userId);
      });
      socketConnection.on("friend-request", (data) => {
        Alert.alert("Thông báo", data.message);
      });
      socketConnection.on("friend-request-accepted", async ({ requestId, userId }) => {
        // console.log("Lời mời kết bạn được chấp nhận:", { requestId, userId });
        Alert.alert("Thông báo", `Lời mời kết bạn của bạn đã được chấp nhận.`);
        await Promise.all([fetchFriends(), fetchSentRequests(true)]);
      });
      socketConnection.on("friend-removed", (data) => {
        console.log("Thông báo", data.message);
      });

      socketConnection.on("group:member-added", (data) => {
        console.log("Đã được thêm vào nhóm:", data);
      });

      socketConnection.on("new-group-invite", (data) => {
        console.log("Nhận lời mời nhóm:", data);
      });

      socketConnection.on("disconnect", (reason) => {
        console.log("Ngắt kết nối Socket.IO. Lý do:", reason);
      });

      socketConnection.on("connect_error", (error) => {
        console.error("Lỗi kết nối Socket.IO", error);
      });
    };

    connectSocket();

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      setCurrentUser({
        ...profile,
        token:
          route.params?.user?.token || (await AsyncStorage.getItem("token")),
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const data = await getFriends();
      setFriends(data || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchFriends();
  }, [fetchProfile, fetchFriends]);

  const handleProfileUpdateSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
  };
  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem("friendRequests");
      await AsyncStorage.removeItem("sentRequests");
      await AsyncStorage.removeItem("friends");
    } catch (err) {
      console.error("Failed to clear cache:", err);
    }
  };
  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await clearCache();
      await logout();

      navigation.navigate("Login");
    } catch (error) {
      console.error("Logout failed:", error);
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
    }, 2500),
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
      const results = await findUserByPhone(formattedQuery);
      const resultsArray = Array.isArray(results) ? results : [results];
      const filteredResults = resultsArray.filter(
        (result) => !selectedMembers.includes(result._id)
      );
      setGroupSearchResults(filteredResults);
    } catch (error) {
      console.error("Lỗi tìm kiếm nhóm:", error);
      setGroupSearchResults([]);
    }
  }, 500),
  [selectedMembers]
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
      setIsSearching(true);
      await sendRequest(receiverId);
      Alert.alert("Thành công", "Lời mời kết bạn đã được gửi!");
      setMessage("Lời mời kết bạn đã được gửi!");
      setTimeout(() => setMessage(""), 3000);
      await Promise.all([fetchFriends(), fetchRequests()]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      setTimeout(() => setMessage(""), 3000);
      Alert.alert("Lỗi", error.message || "Lời mời kết bạn đã được gửi trước đó!");
    } finally {
      setIsSearching(false);
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

  setIsCreatingGroup(true);

  try {
    const groupData = {
      name: groupName,
      members: selectedMembers,
    };
    const response = await createGroup(groupData);
    setShowCreateGroupModal(false);
    setGroupName("");
    setSelectedMembers([]);
    setSelectedMembersDetails([]);
    setGroupSearchQuery("");
    setGroupSearchResults([]);
    navigation.navigate("Chat", {
      conversationId: response.data.group._id,
      chat: {
        _id: response.data.group._id,
        user: {
          fullName: response.data.group.name,
          avatar: response.data.group.avatar,
        },
        type: "group",
      },
      user: currentUser,
    });
  } catch (error) {
    console.error("Lỗi tạo nhóm:", error?.response?.data || error);
    const errorMsg =
      error?.response?.data?.message ||
      "Không thể tạo nhóm, vui lòng thử lại.";
    Alert.alert("Lỗi", errorMsg);
  } finally {
    setIsCreatingGroup(false);
  }
};

const toggleMember = (userId, user = null) => {
  setSelectedMembers((prev) => {
    if (prev.includes(userId)) {
      setSelectedMembersDetails((prevDetails) =>
        prevDetails.filter((member) => member._id !== userId)
      );
      return prev.filter((id) => id !== userId);
    } else {
      if (user) {
        setSelectedMembersDetails((prevDetails) => [...prevDetails, user]);
      }
      return [...prev, userId];
    }
  });
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
              const isFriend = friends.some((friend) => friend._id === item._id);
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
                    isFriend ? (
                      <Text style={styles.friendText}>Bạn bè</Text>
                    ) : (
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
                    )
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
      onDismiss={() => {
        setShowCreateGroupModal(false);
        setGroupName("");
        setSelectedMembers([]);
        setSelectedMembersDetails([]);
        setGroupSearchQuery("");
        setGroupSearchResults([]);
      }}
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
      {/* Hiển thị thành viên đã chọn */}
      {selectedMembersDetails.length > 0 && (
        <View style={styles.selectedMembersContainer}>
          <Text style={styles.sectionTitle}>Thành viên đã chọn</Text>
          <FlatList
            data={selectedMembersDetails}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <Avatar.Image
                  size={40}
                  source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.fullName}</Text>
                  <Text style={styles.userPhone}>{item.phoneNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleMember(item._id)}>
                  <MaterialCommunityIcons
                    name="checkbox-marked"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            )}
            style={styles.selectedMembersList}
          />
        </View>
      )}
      {/* Kết quả tìm kiếm */}
      {groupSearchResults.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
          <FlatList
            data={groupSearchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => toggleMember(item._id, item)}
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
                  name={
                    selectedMembers.includes(item._id)
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
            style={styles.searchResults}
          />
        </>
      )}
      {/* Danh sách bạn bè */}
      <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => toggleMember(item._id, item)}
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
              name={
                selectedMembers.includes(item._id)
                  ? "checkbox-marked"
                  : "checkbox-blank-outline"
              }
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
          disabled={isCreatingGroup}
          contentStyle={styles.createButtonContent}
        >
          {isCreatingGroup ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Tạo nhóm</Text>
          )}
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            setShowCreateGroupModal(false);
            setGroupName("");
            setSelectedMembers([]);
            setSelectedMembersDetails([]);
            setGroupSearchQuery("");
            setGroupSearchResults([]);
          }}
          style={styles.modalButton}
          disabled={isCreatingGroup}
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
    marginLeft: 10,
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
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    paddingTop: 60,
  },
  modalInput: {
    marginHorizontal: 20,
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
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
  searchResults: {
    height: 100,
    maxHeight: 100,
    paddingHorizontal: 30,
  },
  friendsList: {
    paddingHorizontal: 30,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingBottom: 60,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 20,
  },
  createButtonContent: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  friendText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    padding: 5,
  },
  selectedMembersContainer: {
    marginBottom: 10,
  },
  selectedMembersList: {
    maxHeight: 100,
    paddingHorizontal: 30,
  },
});

export default HomeScreen;