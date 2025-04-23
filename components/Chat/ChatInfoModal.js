import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Portal,
  Modal,
  Avatar,
  Text,
  Button,
  IconButton,
  Switch,
} from "react-native-paper";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSocket } from "../../hooks/useSocket";
import {
  getPendingGroupInvitesByGroup,
  acceptGroupInvite,
  rejectGroupInvite,
  sendGroupInvite,
} from "../../apis/pendingGroupInvite.api";
import { getFriendsNotInGroup } from "../../apis/conversationGroup.api";
import AddMemberModal from "./AddMemberModal";

// Tính toán kích thước dựa trên Dimensions
const { width, height } = Dimensions.get("window");
const baseWidth = 375; // iPhone 8 width
const baseHeight = 667; // iPhone 8 height
const scaleWidth = width / baseWidth;
const scaleHeight = height / baseHeight;

const normalize = (size, isHeight = false) => {
  const scale = isHeight ? scaleHeight : scaleWidth;
  return Math.round(size * scale);
};

// Component for rendering each pending invite item
const PendingInviteItem = memo(
  ({ item, isOwner, isAdmin, onAccept, onReject, loading }) => {
    const invitedUser = item.invitedUser || {};
    const invitedBy = item.invitedBy || {};

    console.log("PendingInviteItem item:", JSON.stringify(item, null, 2));

    return (
      <View style={styles.participantItem}>
        <Avatar.Image
          size={normalize(40)}
          source={{ uri: invitedUser.avatar || "https://i.pravatar.cc/150" }}
        />
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {invitedUser.fullName || invitedUser._id || "Không rõ"}
          </Text>
          <Text style={styles.participantRole}>
            Mời bởi: {invitedBy.fullName || invitedBy._id || "Không rõ"} (Đang
            chờ)
          </Text>
        </View>
        {(isOwner || isAdmin) && (
          <View style={styles.memberActions}>
            <IconButton
              icon="check"
              size={normalize(20)}
              onPress={() => onAccept(item._id, invitedUser)}
              iconColor="#0098f9"
              containerColor="transparent"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={loading[item._id]}
              loading={loading[item._id]}
            />
            <IconButton
              icon="close"
              size={normalize(20)}
              onPress={() => onReject(item._id)}
              iconColor="#ff4444"
              containerColor="transparent"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={loading[item._id]}
            />
          </View>
        )}
      </View>
    );
  }
);

const ChatInfoModal = ({
  visible,
  onDismiss,
  chat,
  conversationDetails,
  messages,
  groupMembers,
  isOwner,
  isAdmin,
  user,
  newGroupName,
  setNewGroupName,
  newGroupAvatar,
  setNewGroupAvatar,
  friends: propFriends = [],
  onPickAvatar,
  onUpdateGroupInfo,
  onToggleRequireApproval,
  onLeaveGroup,
  onDeleteGroup,
  onRemoveMember,
  onChangeMemberRole,
  onFetchAvailableFriends,
  onFetchGroupMembers,
  onOpenImagePreview,
  isTogglingApproval,
}) => {
  const isGroup = chat.type === "group";
  const images = messages.filter(
    (msg) => msg.type === "image" && msg.fileMeta?.length > 0
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [friends, setFriends] = useState(
    Array.isArray(propFriends) ? propFriends : []
  );
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [inviteLoading, setInviteLoading] = useState({});
  const inputRef = useRef(null);

  const displayName =
    conversationDetails?.name ||
    conversationDetails?.user?.fullName ||
    chat?.user?.fullName ||
    "Nhóm không tên";
  const displayAvatar =
    Platform.OS === "ios"
      ? (
          conversationDetails?.avatar ||
          conversationDetails?.user?.avatar ||
          chat?.user?.avatar ||
          "https://i.pravatar.cc/150"
        ).replace("file://", "")
      : conversationDetails?.avatar ||
        conversationDetails?.user?.avatar ||
        chat?.user?.avatar ||
        "https://i.pravatar.cc/150";

  // Hàm lấy danh sách bạn bè không có trong nhóm
  const fetchFriendsNotInGroupData = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await getFriendsNotInGroup(chat._id);
      console.log(
        "Friends not in group response:",
        JSON.stringify(response, null, 2)
      );
      const data = response?.data || [];
      setFriends(Array.isArray(data) ? data : []);
      setFriendsLoaded(true);
    } catch (error) {
      console.error("Lỗi lấy danh sách bạn bè không có trong nhóm:", error);
      setFriends([]);
      setFriendsLoaded(false);
    } finally {
      setLoadingFriends(false);
    }
  }, [chat._id]);

  // Tích hợp useSocket để xử lý lời mời nhóm và cập nhật danh sách bạn bè realtime
  const { socket, emitGroupInvite, emitGroupInviteAccepted } = useSocket(
    user._id,
    {
      onNewGroupInvite: useCallback(
        (invite) => {
          if (invite.groupId === chat._id && (isOwner || isAdmin)) {
            fetchPendingInvites();
          }
        },
        [chat._id, isOwner, isAdmin]
      ),
      onGroupInviteAccepted: useCallback(
        ({ user: acceptedUser, groupId }) => {
          if (groupId === chat._id) {
            setPendingInvites((prev) =>
              prev.filter(
                (invite) => invite.invitedUser._id !== acceptedUser._id
              )
            );
            // Xóa người dùng đã chấp nhận khỏi danh sách bạn bè khả dụng
            setFriends((prev) =>
              prev.filter((friend) => friend._id !== acceptedUser._id)
            );
            // Cập nhật danh sách thành viên nhóm
            if (acceptedUser._id && acceptedUser.fullName) {
              setLocalGroupMembers((prev) => {
                if (prev.some((member) => member._id === acceptedUser._id))
                  return prev;
                return [...prev, { ...acceptedUser, role: "member" }];
              });
            } else if (typeof onFetchGroupMembers === "function") {
              onFetchGroupMembers();
            }
            // Tải lại danh sách bạn bè để đảm bảo tính chính xác
            fetchFriendsNotInGroupData();
          }
        },
        [chat._id, onFetchGroupMembers, fetchFriendsNotInGroupData]
      ),
      onGroupInviteRejected: useCallback(
        ({ inviteId, groupId }) => {
          if (groupId === chat._id) {
            setPendingInvites((prev) =>
              prev.filter((invite) => invite._id !== inviteId)
            );
            // Tải lại danh sách bạn bè vì người dùng từ chối có thể quay lại danh sách khả dụng
            fetchFriendsNotInGroupData();
          }
        },
        [chat._id, fetchFriendsNotInGroupData]
      ),
      // Thêm sự kiện khi thành viên bị xóa khỏi nhóm
      onMemberRemoved: useCallback(
        ({ userId, groupId }) => {
          if (groupId === chat._id) {
            setLocalGroupMembers((prev) =>
              prev.filter((member) => member._id !== userId)
            );
            // Tải lại danh sách bạn bè vì người dùng bị xóa có thể quay lại danh sách khả dụng
            fetchFriendsNotInGroupData();
          }
        },
        [chat._id, fetchFriendsNotInGroupData]
      ),
    }
  );

  const [localGroupMembers, setLocalGroupMembers] = useState(groupMembers);

  useEffect(() => {
    setLocalGroupMembers(groupMembers);
  }, [groupMembers]);

  // Lấy danh sách bạn bè ban đầu khi modal mở
  useEffect(() => {
    if (visible && isGroup && (isOwner || isAdmin) && !friendsLoaded) {
      if (propFriends.length === 0) {
        fetchFriendsNotInGroupData();
      } else if (JSON.stringify(friends) !== JSON.stringify(propFriends)) {
        setFriends(Array.isArray(propFriends) ? propFriends : []);
        setFriendsLoaded(true);
      }
    }
  }, [
    visible,
    isGroup,
    isOwner,
    isAdmin,
    propFriends,
    friendsLoaded,
    fetchFriendsNotInGroupData,
  ]);

  useEffect(() => {
    if (visible && isGroup && (isOwner || isAdmin) && isEditingName) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      inputRef.current?.focus();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, isGroup, isOwner, isAdmin, isEditingName]);

  useEffect(() => {
    if (visible && isGroup && (isOwner || isAdmin)) {
      fetchPendingInvites();
    } else {
      setPendingInvites([]);
      setLoadingInvites(false);
    }
  }, [visible, isGroup, isOwner, isAdmin, chat._id]);

  const fetchPendingInvites = async () => {
    try {
      setLoadingInvites(true);
      if (typeof getPendingGroupInvitesByGroup !== "function") {
        console.error(
          "getPendingGroupInvitesByGroup is not a function. Check import in pendingGroupInvite.api.js"
        );
        throw new Error("getPendingGroupInvitesByGroup is not defined");
      }
      const invites = await getPendingGroupInvitesByGroup(chat._id);
      console.log("Pending invites fetched:", JSON.stringify(invites, null, 2));
      const pendingOnly = Array.isArray(invites)
        ? invites.filter((invite) => invite.status === "pending" && invite._id)
        : [];
      setPendingInvites(pendingOnly);
    } catch (error) {
      console.error("Lỗi lấy danh sách lời mời:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách lời mời nhóm.");
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (inviteId, invitedUser) => {
    try {
      setInviteLoading((prev) => ({ ...prev, [inviteId]: true }));
      await acceptGroupInvite(inviteId);
      await rejectGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      setFriends((prev) =>
        prev.filter((friend) => friend._id !== invitedUser._id)
      );
      setLocalGroupMembers((prev) => {
        if (prev.some((member) => member._id === invitedUser._id)) return prev;
        return [...prev, { ...invitedUser, role: "member" }];
      });
      if (socket) {
        socket.emit("accept-group-invite", {
          groupId: chat._id,
          user: invitedUser,
        });
      }
      setFriendsLoaded(false);
      Alert.alert("Thành công", "Lời mời đã được chấp nhận và xóa.");
    } catch (error) {
      console.error("Lỗi chấp nhận lời mời:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể chấp nhận lời xin vào nhóm.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setInviteLoading((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      setInviteLoading((prev) => ({ ...prev, [inviteId]: true }));
      await rejectGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      if (socket) {
        socket.emit("reject-group-invite", {
          groupId: chat._id,
          inviteId,
        });
      }
      Alert.alert("Thành công", "Lời mời đã bị từ chối.");
    } catch (error) {
      console.error("Lỗi từ chối lời mời:", error);
      Alert.alert("Lỗi", error.message || "Không thể từ chối lời mời.");
    } finally {
      setInviteLoading((prev) => ({ ...prev, [inviteId]: false }));
    }
  };

  const handleUpdate = async () => {
    if (!newGroupName.trim() && !newGroupAvatar) {
      setError("Vui lòng nhập tên nhóm hoặc chọn ảnh mới");
      return;
    }
    setError("");
    setIsUpdating(true);
    try {
      await onUpdateGroupInfo();
      setIsEditingName(false);
      setNewGroupName("");
      setNewGroupAvatar(null);
    } catch (error) {
      setError(error.message || "Không thể cập nhật thông tin nhóm");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveAvatar = () => {
    setNewGroupAvatar(null);
  };

  const toggleEditName = () => {
    setIsEditingName(!isEditingName);
    if (isEditingName) {
      setNewGroupName("");
      setNewGroupAvatar(null);
      setError("");
    }
  };

  const sections = useMemo(
    () => [
      {
        key: "groupInfo",
        render: () => (
          <View style={styles.modalAvatarContainer}>
            <TouchableOpacity
              onPress={isOwner || isAdmin ? onPickAvatar : null}
              disabled={!isOwner && !isAdmin}
              style={styles.avatarTouchable}
            >
              <Avatar.Image
                size={normalize(100)}
                source={{ uri: displayAvatar, cache: "reload" }}
                style={styles.avatarImage}
              />
              {(isOwner || isAdmin) && (
                <View style={styles.editAvatarIcon}>
                  <MaterialIcons
                    name="camera-alt"
                    size={normalize(20)}
                    color="white"
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.nameContainer}>
              <Text style={styles.modalChatName}>{displayName}</Text>
              {isGroup && (isOwner || isAdmin) && (
                <TouchableOpacity
                  onPress={toggleEditName}
                  style={styles.editNameIcon}
                >
                  <MaterialIcons
                    name={isEditingName ? "close" : "edit"}
                    size={normalize(20)}
                    color="#0098f9"
                  />
                </TouchableOpacity>
              )}
            </View>
            {isGroup && (isOwner || isAdmin) && isEditingName && (
              <Animated.View
                style={[styles.groupInfoEdit, { opacity: fadeAnim }]}
              >
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={styles.groupNameInput}
                    placeholder={displayName || "Nhập tên nhóm"}
                    placeholderTextColor="#999"
                    value={newGroupName}
                    onChangeText={setNewGroupName}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>
                {newGroupAvatar && (
                  <View style={styles.avatarPreviewContainer}>
                    <TouchableOpacity
                      onPress={() => onOpenImagePreview(newGroupAvatar.uri)}
                    >
                      <Image
                        source={{ uri: newGroupAvatar.uri }}
                        style={styles.avatarPreview}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeAvatarButton}
                      onPress={handleRemoveAvatar}
                    >
                      <MaterialIcons
                        name="close"
                        size={normalize(16)}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <Button
                  mode="contained"
                  onPress={handleUpdate}
                  style={styles.updateButton}
                  contentStyle={styles.updateButtonContent}
                  labelStyle={styles.updateButtonLabel}
                  disabled={
                    (!newGroupName.trim() && !newGroupAvatar) || isUpdating
                  }
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    "Cập nhật"
                  )}
                </Button>
              </Animated.View>
            )}
          </View>
        ),
      },
      ...(isGroup
        ? [
            {
              key: "members",
              render: () => (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.modalSectionTitle}>
                      Thành viên ({localGroupMembers.length || 0})
                    </Text>
                    {(isOwner || isAdmin) && (
                      <TouchableOpacity
                        onPress={() => {
                          fetchFriendsNotInGroupData(); // Tải lại danh sách bạn bè trước khi mở modal
                          setShowAddMemberModal(true);
                        }}
                        disabled={loadingFriends}
                      >
                        <Text style={styles.addMemberText}>
                          {loadingFriends ? "Đang tải..." : "+ Thêm thành viên"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <FlatList
                    data={localGroupMembers}
                    keyExtractor={(item) =>
                      item._id?.toString() || Math.random().toString()
                    }
                    renderItem={({ item }) => (
                      <View style={styles.participantItem}>
                        <Avatar.Image
                          size={normalize(40)}
                          source={{
                            uri: item.avatar || "https://i.pravatar.cc/150",
                          }}
                        />
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.participantRole}>
                            {item.role === "owner"
                              ? "Chủ nhóm"
                              : item.role === "admin"
                              ? "Quản trị viên"
                              : "Thành viên"}
                          </Text>
                        </View>
                        {isOwner && item._id !== user._id && (
                          <View style={styles.memberActions}>
                            <IconButton
                              icon="account-edit"
                              size={normalize(20)}
                              onPress={() =>
                                Alert.alert(
                                  "Thay đổi quyền",
                                  "Chọn vai trò mới:",
                                  [
                                    {
                                      text: "Thành viên",
                                      onPress: () =>
                                        onChangeMemberRole(item._id, "member"),
                                    },
                                    {
                                      text: "Quản trị viên",
                                      onPress: () =>
                                        onChangeMemberRole(item._id, "admin"),
                                    },
                                    {
                                      text: "Chủ nhóm",
                                      onPress: () =>
                                        onChangeMemberRole(item._id, "owner"),
                                    },
                                    { text: "Hủy", style: "cancel" },
                                  ],
                                  { cancelable: true }
                                )
                              }
                              containerColor="transparent"
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                            />
                            <IconButton
                              icon="delete"
                              size={normalize(20)}
                              onPress={() => onRemoveMember(item._id)}
                              iconColor="#ff4444"
                              containerColor="transparent"
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                            />
                          </View>
                        )}
                      </View>
                    )}
                    style={styles.participantList}
                    nestedScrollEnabled={true}
                  />
                </View>
              ),
            },
            ...(isOwner || isAdmin
              ? [
                  {
                    key: "pendingInvites",
                    render: () => (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>
                          Lời mời nhóm ({pendingInvites.length || 0})
                        </Text>
                        {loadingInvites ? (
                          <Text style={styles.loadingText}>Đang tải...</Text>
                        ) : pendingInvites.length === 0 ? (
                          <Text style={styles.emptyText}>
                            Không có lời mời nào.
                          </Text>
                        ) : (
                          <FlatList
                            data={pendingInvites}
                            keyExtractor={(item) =>
                              item._id?.toString() || Math.random().toString()
                            }
                            renderItem={({ item }) => (
                              <PendingInviteItem
                                item={item}
                                isOwner={isOwner}
                                isAdmin={isAdmin}
                                onAccept={handleAcceptInvite}
                                onReject={handleRejectInvite}
                                loading={inviteLoading}
                              />
                            )}
                            style={styles.participantList}
                            nestedScrollEnabled={true}
                          />
                        )}
                      </View>
                    ),
                  },
                ]
              : []),
          ]
        : []),
      ...(images.length > 0
        ? [
            {
              key: "images",
              render: () => (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Ảnh đã gửi ({images.length})
                  </Text>
                  <FlatList
                    data={images}
                    keyExtractor={(item) =>
                      item._id?.toString() || Math.random().toString()
                    }
                    horizontal
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => onOpenImagePreview(item.fileMeta[0].url)}
                      >
                        <Image
                          source={{ uri: item.fileMeta[0].url }}
                          style={styles.sentImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}
                    style={styles.imageList}
                  />
                </View>
              ),
            },
          ]
        : []),
      ...(isGroup
        ? [
            {
              key: "settings",
              render: () => (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Cài đặt nhóm</Text>
                  {isOwner && (
                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>
                        Yêu cầu duyệt thành viên
                      </Text>
                      <Switch
                        value={conversationDetails?.requireApproval}
                        onValueChange={onToggleRequireApproval}
                        color="#0098f9"
                        disabled={isTogglingApproval}
                      />
                    </View>
                  )}
                  <Button
                    mode="outlined"
                    onPress={onLeaveGroup}
                    style={[styles.modalButton, { borderColor: "#ff4444" }]}
                    labelStyle={{ color: "#ff4444" }}
                  >
                    Rời nhóm
                  </Button>
                  {isOwner && (
                    <Button
                      mode="outlined"
                      onPress={onDeleteGroup}
                      style={[styles.modalButton, { borderColor: "#ff4444" }]}
                      labelStyle={{ color: "#ff4444" }}
                    >
                      Giải tán nhóm
                    </Button>
                  )}
                </View>
              ),
            },
          ]
        : []),
    ],
    [
      isGroup,
      images,
      pendingInvites,
      friends,
      isOwner,
      isAdmin,
      localGroupMembers,
      conversationDetails,
      displayName,
      displayAvatar,
    ]
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {isGroup ? "Thông tin nhóm" : "Thông tin đoạn chat"}
          </Text>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.modalCloseText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={sections}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => item.render()}
          contentContainerStyle={{ paddingBottom: normalize(20) }}
        />
      </Modal>
      <AddMemberModal
        visible={showAddMemberModal}
        onDismiss={() => setShowAddMemberModal(false)}
        chatId={chat._id}
        userId={user._id}
        friends={friends}
        onFetchFriends={fetchFriendsNotInGroupData} // Cập nhật prop để sử dụng hàm fetch realtime
        onSendInvites={(newInvites) =>
          setPendingInvites((prev) => [...prev, ...newInvites])
        }
        emitGroupInvite={emitGroupInvite}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: normalize(20),
    padding: normalize(15),
    borderRadius: 12,
    maxHeight: height * 0.9,
    maxWidth: width * 0.9,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(10, true),
  },
  modalTitle: {
    fontSize: normalize(20),
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseText: {
    fontSize: normalize(16),
    color: "#0098f9",
    fontWeight: "500",
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: normalize(20, true),
  },
  modalChatName: {
    fontSize: normalize(18),
    fontWeight: "bold",
    color: "#333",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(10, true),
    marginBottom: normalize(10, true),
  },
  editNameIcon: {
    marginLeft: normalize(8),
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: normalize(6),
    elevation: 2,
  },
  modalSection: {
    marginBottom: normalize(20, true),
  },
  modalSectionTitle: {
    fontSize: normalize(16),
    fontWeight: "bold",
    marginBottom: normalize(10, true),
    color: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addMemberText: {
    fontSize: normalize(14),
    color: "#0098f9",
    fontWeight: "500",
  },
  participantList: {
    maxHeight: normalize(200, true),
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(8, true),
  },
  participantInfo: {
    flex: 1,
    marginLeft: normalize(10),
  },
  participantName: {
    fontSize: normalize(16),
    fontWeight: "500",
    color: "#333",
  },
  participantRole: {
    fontSize: normalize(14),
    color: "#666",
  },
  memberActions: {
    flexDirection: "row",
    zIndex: 1,
  },
  imageList: {
    maxHeight: normalize(100, true),
  },
  sentImage: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: 8,
    marginRight: normalize(10),
  },
  modalButton: {
    marginTop: normalize(10, true),
    borderRadius: 8,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatarImage: {
    borderRadius: normalize(50),
    borderWidth: 2,
    borderColor: "#0098f9",
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0098f9",
    borderRadius: 12,
    padding: normalize(6),
    elevation: 3,
  },
  groupInfoEdit: {
    width: "100%",
    alignItems: "center",
    marginTop: normalize(15, true),
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: normalize(15),
    elevation: 2,
  },
  inputContainer: {
    width: "100%",
    marginBottom: normalize(10, true),
  },
  groupNameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: normalize(12),
    fontSize: normalize(16),
    backgroundColor: "white",
    elevation: 1,
    color: "#333",
  },
  errorText: {
    fontSize: normalize(12),
    color: "#ff4444",
    marginTop: normalize(5, true),
    textAlign: "center",
  },
  avatarPreviewContainer: {
    position: "relative",
    marginBottom: normalize(10, true),
  },
  avatarPreview: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    borderWidth: 2,
    borderColor: "#0098f9",
  },
  removeAvatarButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    width: normalize(20),
    height: normalize(20),
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  updateButton: {
    width: "100%",
    backgroundColor: "#0098f9",
    borderRadius: 10,
    elevation: 3,
  },
  updateButtonContent: {
    paddingVertical: normalize(8, true),
  },
  updateButtonLabel: {
    fontSize: normalize(16),
    fontWeight: "bold",
    color: "white",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: normalize(10, true),
  },
  switchLabel: {
    fontSize: normalize(16),
    color: "#333",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    marginVertical: normalize(10, true),
  },
  emptyText: {
    fontSize: normalize(14),
    color: "#666",
    textAlign: "center",
    marginVertical: normalize(10, true),
  },
});

export default ChatInfoModal;
