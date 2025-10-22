import { API_BASE_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get token from AsyncStorage
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Service to update user information
export const updateUserInfo = async (userId, userInfo) => {
  try {
    const token = await getAuthToken();
    
    console.log('Updating user info:', { userId, userInfo });

    const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(userInfo),
    });

    console.log('Response status:', res.status);
    
    const data = await res.json();
    console.log('Response data:', data);

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update user information');
    }

    return data;
  } catch (error) {
    console.error('Error updating user information:', error);
    throw error;
  }
};

// Service to update user password
export const updateUserPassword = async (userId, oldPassword, newPassword) => {
  try {
    const token = await getAuthToken();
    
    console.log('Changing password for user:', userId);

    const res = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ 
        oldPassword, 
        newPassword 
      }),
    });

    console.log('Response status:', res.status);
    
    const data = await res.json();
    console.log('Response data:', data);

    if (!res.ok) {
      // Check for specific error messages
      if (data.message === 'Mật khẩu cũ không chính xác') {
        throw new Error('Old password is incorrect');
      }
      throw new Error(data.message || 'Failed to update password');
    }

    return data;
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

// Alternative: Update user info with user ID in URL (if your API uses this format)
export const updateUserInfoById = async (userId, userInfo) => {
  try {
    const token = await getAuthToken();
    
    console.log('Updating user info by ID:', { userId, userInfo });

    const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(userInfo),
    });

    console.log('Response status:', res.status);
    
    const data = await res.json();
    console.log('Response data:', data);

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update user information');
    }

    return data;
  } catch (error) {
    console.error('Error updating user information:', error);
    throw error;
  }
};