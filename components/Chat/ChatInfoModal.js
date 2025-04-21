import React, { useState, useEffect, useRef, memo, useMemo } from "react";
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
import { getFriends } from "../../apis/contact.api";

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
  onOpenImagePreview,
}) => {
  const isGroup = chat.type === "group";
  const images = messages.filter(
    (msg) => msg.type === "image" && msg.fileMeta?.length > 0
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [friends, setFriends] = useState(propFriends);
  const inputRef = useRef(null);

  // Lọc bạn bè không có trong nhóm
  const filteredFriends = useMemo(() => {
    const memberIds = groupMembers.map((member) => member._id);
    return friends.filter((friend) => !memberIds.includes(friend._id));
  }, [friends, groupMembers]);

  // Tích hợp useSocket để xử lý lời mời nhóm realtime
  const { socket, emitGroupInvite, emitGroupInviteAccepted } = useSocket(
    user._id,
    {
      onNewGroupInvite: (invite) => {
        if (invite.groupId._id === chat._id && (isOwner || isAdmin)) {
          setPendingInvites((prev) => [...prev, invite]);
          Alert.alert(
            "Lời mời nhóm mới",
            `${
              invite.invitedBy.fullName || invite.invitedBy._id || "Không rõ"
            } đã mời ${
              invite.invitedUser.fullName ||
              invite.invitedUser._id ||
              "Không rõ"
            } vào nhóm`
          );
        }
      },
      onGroupInviteAccepted: ({ user, groupId }) => {
        if (groupId === chat._id) {
          onFetchAvailableFriends();
          setPendingInvites((prev) =>
            prev.filter((invite) => invite.invitedUser._id !== user._id)
          );
        }
      },
    }
  );

  // Lấy danh sách bạn bè nếu propFriends rỗng
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await getFriends();
        console.log("Friends data:", JSON.stringify(data, null, 2));
        setFriends(data || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách bạn bè:", error);
      }
    };

    if (visible && isGroup && (isOwner || isAdmin)) {
      if (propFriends.length === 0) {
        fetchFriends();
      } else if (JSON.stringify(friends) !== JSON.stringify(propFriends)) {
        setFriends(propFriends);
      }
    }
  }, [visible, isGroup, isOwner, isAdmin, propFriends, friends]);

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
      setPendingInvites(invites || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách lời mời:", error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      await acceptGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      onFetchAvailableFriends();
      if (socket) {
        socket.emit("accept-group-invite", {
          groupId: chat._id,
          user: { _id: user._id },
        });
      }
      Alert.alert("Thành công", "Lời mời đã được chấp nhận.");
    } catch (error) {
      console.error("Lỗi chấp nhận lời mời:", error);
      Alert.alert("Lỗi", error.message || "Không thể chấp nhận lời mời.");
    }
  };

  const handleRejectInvite = async (inviteId) => {
    try {
      await rejectGroupInvite(inviteId);
      setPendingInvites((prev) =>
        prev.filter((invite) => invite._id !== inviteId)
      );
      Alert.alert("Thành công", "Lời mời đã bị từ chối.");
    } catch (error) {
      console.error("Lỗi từ chối lời mời:", error);
      Alert.alert("Lỗi", error.message || "Không thể từ chối lời mời.");
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvites = async () => {
    if (selectedMembers.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một người để mời.");
      return;
    }

    setLoadingInvite(true);
    try {
      const newInvites = [];
      for (const invitedUserId of selectedMembers) {
        const invite = await sendGroupInvite(chat._id, invitedUserId, user._id);
        if (socket) {
          emitGroupInvite(invitedUserId, invite);
        }
        newInvites.push(invite);
      }
      setPendingInvites((prev) => [...prev, ...newInvites]);
      setShowInviteModal(false);
      setSelectedMembers([]);
      Alert.alert("Thành công", "Đã gửi lời mời đến các thành viên được chọn.");
    } catch (error) {
      console.error("Lỗi gửi lời mời nhóm:", error);
      Alert.alert("Lỗi", error.message || "Không thể gửi lời mời nhóm.");
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleUpdate = () => {
    if (!newGroupName.trim() && !newGroupAvatar) {
      setError("Vui lòng nhập tên nhóm hoặc chọn ảnh mới");
      return;
    }
    setError("");
    setIsEditingName(false);
    setNewGroupName("");
    setNewGroupAvatar(null);
    onUpdateGroupInfo();
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

  // Modal con để mời thành viên
  const InviteMemberModal = memo(() => (
    <Portal>
      <Modal
        visible={showInviteModal}
        onDismiss={() => {
          setShowInviteModal(false);
          setSelectedMembers([]);
        }}
        contentContainerStyle={styles.inviteModalContainer}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Mời thành viên vào nhóm</Text>
          <TouchableOpacity
            onPress={() => {
              setShowInviteModal(false);
              setSelectedMembers([]);
            }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCloseText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        {!filteredFriends || filteredFriends.length === 0 ? (
          <Text style={styles.emptyText}>Không có bạn bè nào để mời.</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Danh sách bạn bè</Text>
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item._id}
              initialNumToRender={10}
              getItemLayout={(data, index) => ({
                length: normalize(64, true),
                offset: normalize(64, true) * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => toggleMember(item._id)}
                  activeOpacity={0.7}
                >
                  <Avatar.Image
                    size={normalize(48)}
                    source={{ uri: item.avatar || "https://i.pravatar.cc/150" }}
                  />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {item.fullName || "Không rõ"}
                    </Text>
                    <Text style={styles.userPhone}>
                      {item.phoneNumber || "Không có số"}
                    </Text>
                  </View>
                  <View style={styles.checkboxContainer}>
                    <MaterialCommunityIcons
                      name={
                        selectedMembers.includes(item._id)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={normalize(28)}
                      color="#0098f9"
                    />
                  </View>
                </TouchableOpacity>
              )}
              style={styles.friendsList}
            />
            <Button
              mode="contained"
              onPress={handleSendInvites}
              style={styles.sendInviteButton}
              contentStyle={styles.sendInviteButtonContent}
              labelStyle={styles.sendInviteText}
              disabled={loadingInvite}
              loading={loadingInvite}
            >
              Gửi lời mời vào nhóm
            </Button>
          </>
        )}
      </Modal>
    </Portal>
  ));

  const sections = [
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
              source={{
                uri:
                  isGroup && conversationDetails?.avatar
                    ? conversationDetails.avatar
                    : chat?.user?.avatar || "https://i.pravatar.cc/150",
              }}
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
            <Text style={styles.modalChatName}>
              {isGroup
                ? conversationDetails?.name || "Nhóm không tên"
                : chat?.user?.fullName || "Không có tên"}
            </Text>
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
                  placeholder={conversationDetails?.name || "Nhập tên nhóm"}
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
                disabled={!newGroupName.trim() && !newGroupAvatar}
              >
                Cập nhật
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
                    Thành viên ({groupMembers.length || 0})
                  </Text>
                  <TouchableOpacity onPress={() => setShowInviteModal(true)}>
                    <Text style={styles.addMemberText}>+ Thêm thành viên</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={groupMembers}
                  keyExtractor={(item) => item._id}
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
                          />
                          <IconButton
                            icon="delete"
                            size={normalize(20)}
                            onPress={() => onRemoveMember(item._id)}
                            iconColor="#ff4444"
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
                  <Text style={styles.emptyText}>Không có lời mời nào.</Text>
                ) : (
                  <FlatList
                    data={pendingInvites}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => {
                      // Ánh xạ thông tin từ friends
                      const invitedUserId =
                        typeof item.invitedUser === "string"
                          ? item.invitedUser
                          : item.invitedUser?._id;
                      const invitedById =
                        typeof item.invitedBy === "string"
                          ? item.invitedBy
                          : item.invitedBy?._id;
                      const invitedUser =
                        friends.find((f) => f._id === invitedUserId) || {};
                      const invitedBy =
                        friends.find((f) => f._id === invitedById) || {};
                      console.log("Pending invite item:", item);
                      console.log("Mapped invitedUser:", invitedUser);
                      console.log("Mapped invitedBy:", invitedBy);
                      return (
                        <View style={styles.participantItem}>
                          <Avatar.Image
                            size={normalize(40)}
                            source={{
                              uri:
                                invitedUser.avatar ||
                                "https://i.pravatar.cc/150",
                            }}
                          />
                          <View style={styles.participantInfo}>
                            <Text style={styles.participantName}>
                              {invitedUser.fullName ||
                                invitedUserId ||
                                "Không rõ"}
                            </Text>
                            <Text style={styles.participantRole}>
                              Mời bởi:{" "}
                              {invitedBy.fullName || invitedById || "Không rõ"}{" "}
                              (Đang chờ)
                            </Text>
                          </View>
                          {(isOwner || isAdmin) && (
                            <View style={styles.memberActions}>
                              <IconButton
                                icon="check"
                                size={normalize(20)}
                                onPress={() => handleAcceptInvite(item._id)}
                                iconColor="#0098f9"
                              />
                              <IconButton
                                icon="close"
                                size={normalize(20)}
                                onPress={() => handleRejectInvite(item._id)}
                                iconColor="#ff4444"
                              />
                            </View>
                          )}
                        </View>
                      );
                    }}
                    style={styles.participantList}
                    nestedScrollEnabled={true}
                  />
                )}
              </View>
            ),
          },
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
                  keyExtractor={(item) => item._id}
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
  ];

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
      <InviteMemberModal />
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
  inviteModalContainer: {
    backgroundColor: "white",
    margin: normalize(20),
    padding: normalize(15),
    borderRadius: 12,
    maxHeight: height * 0.8,
    elevation: 5,
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
  closeButton: {
    padding: normalize(10),
    borderRadius: 8,
    minWidth: normalize(60),
    minHeight: normalize(44, true),
    justifyContent: "center",
    alignItems: "center",
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
  sendInviteButton: {
    margin: normalize(15),
    borderRadius: 8,
    backgroundColor: "#0098f9",
    elevation: 3,
  },
  sendInviteButtonContent: {
    paddingVertical: normalize(8, true),
    paddingHorizontal: normalize(16),
    minHeight: normalize(48, true),
  },
  sendInviteText: {
    fontSize: normalize(16),
    fontWeight: "500",
    color: "white",
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
  sectionTitle: {
    fontSize: normalize(16),
    fontWeight: "bold",
    marginVertical: normalize(10, true),
    paddingHorizontal: normalize(15),
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: normalize(12, true),
    paddingHorizontal: normalize(10),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: normalize(64, true),
  },
  userInfo: {
    flex: 1,
    marginLeft: normalize(12),
  },
  userName: {
    fontSize: normalize(16),
    fontWeight: "500",
    color: "#333",
  },
  userPhone: {
    fontSize: normalize(14),
    color: "#666",
  },
  checkboxContainer: {
    padding: normalize(8),
    justifyContent: "center",
    alignItems: "center",
  },
  friendsList: {
    maxHeight: normalize(300, true),
    paddingHorizontal: normalize(15),
  },
});

export default ChatInfoModal;
