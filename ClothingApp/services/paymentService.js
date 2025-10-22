import { API_BASE_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fetch payment details including cart and user information
export const getPaymentDetails = async () => {
  try {
    // Get user ID from local storage
    const userData = await AsyncStorage.getItem('user');
    if (!userData) throw new Error('User not found');

    const user = JSON.parse(userData);
    const user_id = user.user_id;

    // Fetch cart details
    const res = await fetch(`${API_BASE_URL}/cart?user_id=${user_id}`);
    if (!res.ok) throw new Error('Failed to fetch cart details');

    const cart = await res.json();

    // Calculate subtotal and total
    const shippingFee = 25000; // Default shipping fee
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const total = subtotal + shippingFee;

    return { cart, subtotal, shippingFee, total };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

// Fetch user information from local storage
export const getUserInfo = async () => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) throw new Error('User not found');
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
};

// Fetch all payments
export const getPayments = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

// Create a new payment
export const createPayment = async (paymentData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!res.ok) throw new Error('Failed to create payment');
    return res.json();
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

// Tạo đơn hàng
export const createOrder = async (orderData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Tạo chi tiết đơn hàng
export const createOrderDetails = async (orderDetailData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/order_details`, { // Sửa URL để khớp với định tuyến chính xác
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderDetailData),
    });

    if (!res.ok) throw new Error('Failed to create order details');
    return res.json();
  } catch (error) {
    console.error('Error creating order details:', error);
    throw error;
  }
};

// Xóa giỏ hàng của người dùng
export const clearUserCart = async (user_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/cart/clear?user_id=${user_id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to clear user cart');
    return res.json();
  } catch (error) {
    console.error('Error clearing user cart:', error);
    throw error;
  }
};
