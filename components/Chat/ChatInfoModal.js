import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Alert,
  Animated,
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
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import AddMemberModal from "./AddMemberModal";
import InviteMemberModal from "./InviteMemberModal";
import { useGroupInvite } from "../../hooks/useGroupInvite";

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
  showAddMemberModal,
  setShowAddMemberModal,
  onPickAvatar,
  onUpdateGroupInfo,
  onToggleRequireApproval,
  onLeaveGroup,
  onDeleteGroup,
  onAddMember,
  onRemoveMember,
  onChangeMemberRole,
  onOpenImagePreview,
  isTogglingApproval,
  socket,
}) => {
  const isGroup = chat.type === "group";
  const images = messages.filter(
    (msg) => msg.type === "image" && msg.fileMeta?.length > 0
  );
  const files = messages.filter(
    (msg) =>
      (msg.type === "audio" || msg.type === "file") && msg.fileMeta?.length > 0
  );
  const [fadeAnim] = useState(new Animated.Value(0));
  const [membersExpanded, setMembersExpanded] = useState(false);
  const [membersHeightAnim] = useState(new Animated.Value(0));
  const [error, setError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const inputRef = useRef(null);

  const isMember = !isOwner && !isAdmin;
  const showInviteButton =
    isGroup && isMember && conversationDetails?.requireApproval;

  const {
    pendingInvites,
    availableFriends,
    friendsLoaded,
    loadingInvites,
    fetchPendingInvites,
    fetchAvailableFriends,
    handleAcceptInvite,
    handleRejectInvite,
    handleSendInvite,
  } = useGroupInvite(user._id, chat._id, socket);

  const displayName =
    conversationDetails?.user?.fullName ||
    chat?.user?.fullName ||
    "Nhóm không tên";
  const displayAvatar =
    Platform.OS === "ios"
      ? (
          conversationDetails?.user?.avatar ||
          chat?.user?.avatar ||
          "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg"
        ).replace("file://", "")
      : conversationDetails?.user?.avatar ||
        chat?.user?.avatar ||
        "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg";
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
    if (visible && isGroup && (isOwner || isAdmin) && socket) {
      const handleNewGroupInvite = (data) => {
        console.log("New group invite in ChatInfoModal:", data);
        const eventData = Array.isArray(data) ? data[0] : data;
        const { groupId, invitedUser, invitedBy, inviteId } = eventData;

        if (groupId === chat._id) {
          fetchPendingInvites();
        }
      };

      socket.on("new-group-invite", handleNewGroupInvite);

      // Cleanup
      return () => {
        socket.off("new-group-invite", handleNewGroupInvite);
      };
    }
  }, [
    visible,
    isGroup,
    isOwner,
    isAdmin,
    socket,
    chat._id,
    fetchPendingInvites,
  ]);
  useEffect(() => {
    Animated.timing(membersHeightAnim, {
      toValue: membersExpanded ? 200 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [membersExpanded]);

  useEffect(() => {
    if (visible && isGroup) {
      fetchPendingInvites();
      fetchAvailableFriends();
    }
  }, [visible, isGroup, fetchPendingInvites, fetchAvailableFriends]);

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

  const toggleMembers = () => {
    setMembersExpanded(!membersExpanded);
  };

  const sections = [
    {
      key: "groupInfo",
      render: () => (
        <View style={styles.modalAvatarContainer}>
          <TouchableOpacity
            onPress={
              (isOwner || isAdmin) && isEditingName
                ? onPickAvatar
                : () =>
                    console.log(
                      "Chọn ảnh bị vô hiệu hóa - cần vào chế độ chỉnh sửa"
                    )
            }
            disabled={!(isOwner || isAdmin) || !isEditingName}
            style={styles.avatarTouchable}
          >
            <Avatar.Image
              size={100}
              source={{ uri: displayAvatar, cache: "reload" }}
              style={[
                styles.avatarImage,
                !(isOwner || isAdmin) || !isEditingName ? { opacity: 0.7 } : {},
              ]}
            />
            {(isOwner || isAdmin) && (
              <View style={styles.editAvatarIcon}>
                <MaterialIcons name="camera-alt" size={20} color="white" />
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
                  size={20}
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
                    <MaterialIcons name="close" size={16} color="white" />
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
    ////////////////////////////////////////////////////////////////////////////////////
    ...(isGroup
      ? [
          {
            key: "pendingInvites",
            render: () =>
              (isOwner || isAdmin) && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    Danh sách duyệt vào nhóm ({pendingInvites.length})
                  </Text>
                  {loadingInvites ? (
                    <ActivityIndicator size="small" color="#0098f9" />
                  ) : pendingInvites.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Không có lời mời nào đang chờ.
                    </Text>
                  ) : (
                    <FlatList
                      data={pendingInvites}
                      keyExtractor={(item) => item._id}
                      renderItem={({ item }) => (
                        <View style={styles.inviteItem}>
                          <Avatar.Image
                            size={40}
                            source={{
                              uri:
                                item.invitedUser.avatar ||
                                "https://i.pravatar.cc/150",
                            }}
                          />
                          <View style={styles.inviteInfo}>
                            <Text style={styles.inviteName}>
                              {item.invitedUser.fullName}
                            </Text>
                            <Text style={styles.inviteStatus}>
                              Được mời bởi:{" "}
                              {item.invitedBy?.fullName || "Unknown"}
                            </Text>
                          </View>
                          <View style={styles.inviteActions}>
                            <IconButton
                              icon="check"
                              size={20}
                              onPress={() => handleAcceptInvite(item._id)}
                              iconColor="#0098f9"
                            />
                            <IconButton
                              icon="close"
                              size={20}
                              onPress={() => handleRejectInvite(item._id)}
                              iconColor="#ff4444"
                            />
                          </View>
                        </View>
                      )}
                      style={styles.inviteList}
                    />
                  )}
                </View>
              ),
          },
          {
            key: "members",
            render: () => (
              <View style={styles.modalSection}>
                <TouchableOpacity
                  onPress={toggleMembers}
                  style={styles.sectionHeader}
                >
                  <Text style={styles.modalSectionTitle}>
                    Thành viên ({groupMembers.length || 0})
                  </Text>

                  <View style={styles.sectionHeaderRight}>
                    <MaterialIcons
                      name={membersExpanded ? "expand-less" : "expand-more"}
                      size={28}
                      color="black"
                      style={styles.iconStyle}
                    />
                  </View>
                </TouchableOpacity>

                <Animated.View
                  style={[
                    styles.membersContainer,
                    { height: membersHeightAnim },
                  ]}
                >
                  <FlatList
                    data={groupMembers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <View style={styles.participantItem}>
                        <Avatar.Image
                          size={40}
                          source={{
                            uri:
                              item.avatar ||
                              "https://i.pinimg.com/736x/2f/15/f2/2f15f2e8c688b3120d3d26467b06330c.jpg",
                          }}
                        />
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>
                            {item.fullName}
                            {item._id === user._id && " (Bạn)"}
                          </Text>
                          <Text style={styles.participantRole}>
                            {item.role === "owner"
                              ? "Trưởng nhóm"
                              : item.role === "admin"
                              ? "Phó nhóm"
                              : "Thành viên"}
                          </Text>
                        </View>
                        {isOwner && item._id !== user._id && (
                          <View style={styles.memberActions}>
                            <IconButton
                              icon="account-edit"
                              size={20}
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
                                      text: "Phó nhóm",
                                      onPress: () =>
                                        onChangeMemberRole(item._id, "admin"),
                                    },
                                    {
                                      text: "Trưởng nhóm",
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
                              size={20}
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
                </Animated.View>
                {/*thay đổi nút thêm thành viên bằng cách bắt sự kiện realtime nút toggle */}
                <TouchableOpacity
                  onPress={() => {
                    if (showInviteButton) {
                      fetchAvailableFriends();
                      setShowInviteModal(true);
                    } else {
                      fetchAvailableFriends();
                      setShowAddMemberModal(true);
                    }
                  }}
                >
                  <Text style={styles.addMemberText}>
                    {showInviteButton
                      ? "+ Gửi yêu cầu vào nhóm"
                      : "+ Thêm thành viên"}
                  </Text>
                </TouchableOpacity>
                {/*kết thúc nút */}
              </View>
            ),
          },

          /////////////////////////////////////////////////////////////
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
    ...(files.length > 0
      ? [
          {
            key: "files",
            render: () => (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>
                  Tệp đã gửi ({files.length})
                </Text>
                <FlatList
                  data={files}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.fileItem}>
                      <FontAwesome5
                        name={
                          item.type === "audio" ? "play-circle" : "file-alt"
                        }
                        size={24}
                        color="#0098f9"
                      />
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName}>
                          {item.fileMeta[0].name}
                        </Text>
                        <Text style={styles.fileSize}>
                          {(item.fileMeta[0].size / 1024).toFixed(2)} KB
                          {item.type === "audio" && item.fileMeta[0].duration
                            ? ` • ${item.fileMeta[0].duration}s`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  )}
                  style={styles.fileList}
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
                {!isOwner && (
                  <Button
                    mode="outlined"
                    onPress={onLeaveGroup}
                    style={[styles.modalButton, { borderColor: "#ff4444" }]}
                    labelStyle={{ color: "#ff4444" }}
                  >
                    Rời nhóm
                  </Button>
                )}
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
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </Modal>
      <AddMemberModal
        visible={showAddMemberModal}
        onDismiss={() => setShowAddMemberModal(false)}
        availableFriends={availableFriends}
        friendsLoaded={friendsLoaded}
        onAddMember={onAddMember}
      />
      {/*Gọi các tham số vào modal inviteMemberModal */}
      <InviteMemberModal
        visible={showInviteModal}
        onDismiss={() => setShowInviteModal(false)}
        availableFriends={availableFriends}
        friendsLoaded={friendsLoaded}
        onSendInvite={handleSendInvite}
        requireApproval={conversationDetails?.requireApproval}
        isMember={isMember}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    padding: 15,
    borderRadius: 12,
    maxHeight: "100%",
    maxWidth: "100%",
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#0098f9",
    fontWeight: "500",
  },
  modalAvatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalChatName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  editNameIcon: {
    marginLeft: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 6,
    elevation: 2,
  },
  modalSection: {},
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "center",
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  addMemberText: {
    textAlign: "right",
    fontSize: 14,
    color: "#0098f9",
    fontWeight: "500",
  },
  membersContainer: {
    overflow: "hidden",
  },
  participantList: {
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  participantInfo: {
    flex: 1,
    marginLeft: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  participantRole: {
    fontSize: 14,
    color: "#666",
  },
  memberActions: {
    flexDirection: "row",
  },
  imageList: {
    maxHeight: 100,
  },
  sentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  fileList: {
    maxHeight: 200,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  fileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  fileSize: {
    fontSize: 14,
    color: "#666",
  },
  modalButton: {
    marginTop: 10,
    borderRadius: 8,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatarImage: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#0098f9",
  },
  editAvatarIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0098f9",
    borderRadius: 12,
    padding: 6,
    elevation: 3,
  },
  groupInfoEdit: {
    width: "100%",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  groupNameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    elevation: 1,
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 5,
    textAlign: "center",
  },
  avatarPreviewContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatarPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#0098f9",
  },
  removeAvatarButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    width: 20,
    height: 20,
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
    paddingVertical: 8,
  },
  updateButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  iconStyle: {
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 20,
    padding: 1,
    backgroundColor: "white",
    shadowColor: "black",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
  //css invite group
  inviteList: {
    maxHeight: 200,
  },
  inviteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  inviteInfo: {
    flex: 1,
    marginLeft: 10,
  },
  inviteName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  inviteStatus: {
    fontSize: 14,
    color: "#666",
  },
  inviteActions: {
    flexDirection: "row",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginVertical: 10,
  },
  /////////////////////////////////////////////////
});

export default ChatInfoModal;
