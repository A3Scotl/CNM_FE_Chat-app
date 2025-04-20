import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("❌ Lỗi khi lấy token từ AsyncStorage:", error);
    return null;
  }
};

// Tạo nhóm mới
export const createGroup = async (groupData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post("/conversationGroup", groupData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Thêm thành viên vào nhóm
export const addGroupMember = async (groupId, userId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/conversationGroup/${groupId}/add-member`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi thêm thành viên vào nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Xóa thành viên khỏi nhóm
export const removeGroupMember = async (groupId, userId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/conversationGroup/${groupId}/remove-member`,
      { userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi xóa thành viên khỏi nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Giải tán nhóm
export const deleteGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.delete(`/conversationGroup/${groupId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi giải tán nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Thay đổi quyền thành viên
export const changeMemberRole = async (groupId, userId, newRole) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/conversationGroup/${groupId}/change-role`,
      { userId, newRole },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi thay đổi quyền thành viên:", error?.response?.data || error);
    throw error;
  }
};

// Rời nhóm
export const leaveGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(`/conversationGroup/${groupId}/leave`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi rời nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách thành viên nhóm với vai trò
export const getGroupMembersWithRoles = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/conversationGroup/${groupId}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách thành viên:", error?.response?.data || error);
    throw error;
  }
};

// Tìm kiếm nhóm theo tên
export const searchGroupsByName = async (keyword) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/conversationGroup/search/by-name`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { keyword },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi tìm kiếm nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Cập nhật thông tin nhóm
export const updateGroupInfo = async (groupId, name, avatar) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.put(
      `/conversationGroup/${groupId}/update-info`,
      { name, avatar },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật thông tin nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Lấy danh sách bạn bè không có trong nhóm
export const getFriendsNotInGroup = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.get(`/conversationGroup/${groupId}/friends-not-in-group`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách bạn bè không có trong nhóm:", error?.response?.data || error);
    throw error;
  }
};

// Bật/tắt yêu cầu duyệt thành viên
export const toggleRequireApproval = async (groupId) => {
  try {
    const token = await getToken();
    if (!token) throw new Error("Token không tồn tại");

    const res = await axiosInstance.post(
      `/conversationGroup/${groupId}/toggle-require-approval`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi bật/tắt yêu cầu duyệt:", error?.response?.data || error);
    throw error;
  }
};