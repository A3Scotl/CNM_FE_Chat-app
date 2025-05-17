import { Alert } from "react-native";
import { toggleRequireApproval } from "../apis/conversationGroup.api";

export const handleToggleRequireApproval = async (
  groupId,
  setConversationDetails,
  setIsToggling,
  onGroupUpdated
) => {
  try {
    setIsToggling(true);
    console.log(`Calling toggleRequireApproval for group: ${groupId}`);
    const response = await toggleRequireApproval(groupId);
    console.log(
      "API toggleRequireApproval response:",
      JSON.stringify(response, null, 2)
    );
    setConversationDetails((prev) => ({
      ...prev,
      requireApproval: response.requireApproval ?? false,
    }));
    Alert.alert(
      "Thành công",
      response.requireApproval
        ? "Đã bật yêu cầu duyệt thành viên."
        : "Đã tắt yêu cầu duyệt thành viên."
    );
    if (onGroupUpdated) {
      console.log("Calling onGroupUpdated to refresh conversations");
      await onGroupUpdated();
    }
  } catch (error) {
    console.error(
      "Error toggling requireApproval:",
      error.message,
      error.stack
    );
    Alert.alert("Lỗi", error.message || "Không thể thay đổi cài đặt nhóm.");
  } finally {
    setIsToggling(false);
  }
};
