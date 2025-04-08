import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/user';

const uploadAvatar = async (avatarUri, authToken) => {
    const formData = new FormData();
    const fileType = avatarUri.split('.').pop();
    
    formData.append('avatar', {
        uri: avatarUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
    });

    try {
        const response = await axios.patch(
            `http://localhost:5000/api/user/me`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${authToken}`,
                },
                timeout: 10000,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Upload avatar error:', {
            status: error.response?.status,
            data: error.response?.data,
        });
        throw error;
    }
};

export const userApi = {
    uploadAvatar,
};