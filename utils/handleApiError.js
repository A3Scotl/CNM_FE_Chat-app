export const handleApiError = (error) => {
  if (error.response) {
    throw new Error(error.response.data?.message || 'Đã xảy ra lỗi từ server');
  } else if (error.request) {
    throw new Error('Không thể kết nối đến máy chủ. Kiểm tra mạng!');
  } else {
    throw new Error('Lỗi không xác định');
  }
};
