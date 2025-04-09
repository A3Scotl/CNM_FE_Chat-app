export const patterns = {
    fullName: /^[a-zA-ZÀ-ỹ\s]{6,}$/,
    userName: /^[a-zA-Z0-9_]{4,}$/,
    phoneNumber: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    passWord: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/
  };
  
  export const validateField = (name, value, form) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Họ và tên là bắt buộc';
        else if (!patterns.fullName.test(value)) error = 'Họ và tên phải có ít nhất 6 ký tự và chỉ chứa chữ cái';
        break;
      case 'userName':
        if (!value.trim()) error = 'Tên người dùng là bắt buộc';
        else if (!patterns.userName.test(value)) error = 'Tên người dùng phải có ít nhất 4 ký tự và chỉ chứa chữ cái, số và dấu gạch dưới';
        break;
      case 'phoneNumber':
        if (!value.trim()) error = 'Số điện thoại là bắt buộc';
        else if (!patterns.phoneNumber.test(value)) error = 'Số điện thoại không hợp lệ';
        break;
      case 'email':
        if (!value.trim()) error = 'Email là bắt buộc';
        else if (!patterns.email.test(value)) error = 'Email không hợp lệ';
        break;
      case 'passWord':
        if (!value.trim()) error = 'Mật khẩu là bắt buộc';
        else if (!patterns.passWord.test(value)) error = 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm cả chữ và số';
        break;
      case 'confirmPassword':
        if (!value.trim()) error = 'Xác nhận mật khẩu là bắt buộc';
        else if (value !== form.passWord) error = 'Mật khẩu không khớp';
        break;
      default:
        break;
    }
    return error;
  };
  