export const handleApiError = (error) => {
    if (error.response) {
      return error.response.data?.message || 'Đã xảy ra lỗi từ server';
    } else if (error.request) {
      return 'Không thể kết nối đến máy chủ. Kiểm tra mạng!';
    } else {
      return 'Lỗi không xác định';
    }
  };
  
  