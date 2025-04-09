import axios from "axios";
import { handleApiError } from "../utils/handleApiError";

const API_BASE_URL = "http://192.168.110.60:5000/api";

export const login = async ({ phoneNumber, passWord }) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/auth/log-in`, {
      phoneNumber,
      passWord,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
      timeout: 10000,
    });

    return data;
  } catch (error) {
    handleApiError(error);
  }
};

export const register = async (form) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/sign-up`, form, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logout = async () => {
  try {
    await axios.get(`${API_BASE_URL}/auth/log-out`, {
      withCredentials: true,
    });
  } catch (error) {
    throw handleApiError(error);
  }
};
