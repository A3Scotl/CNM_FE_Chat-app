export const handleApiError = (error) => {
    if (error.response) {
      // Server trả về response lỗi
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Đã có lỗi xảy ra từ máy chủ";
      return msg;
    } else if (error.request) {
      // Gửi request nhưng không nhận được response
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
    } else {
      // Lỗi khác
      return "Đã xảy ra lỗi không xác định.";
    }
  };
  