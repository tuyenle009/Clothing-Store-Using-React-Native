import { API_BASE_URL } from '../config/config';

// Fetch all orders for a user
export const getUserOrders = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch orders');

    const orders = await response.json();
    return orders.map(order => ({
      ...order,
      created_at: new Date(order.created_at),
    }));
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// Fetch order details for a specific order
export const getOrderDetails = async (orderId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/order_details/order/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order details');

    const orderDetails = await response.json();
    
    return orderDetails.map(detail => ({
      ...detail,
      subtotal: detail.price * detail.quantity,
    }));
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Cancel an order
export const cancelOrder = async (orderId) => {
  try {
    console.log('Canceling order:', orderId);
    console.log('URL:', `${API_BASE_URL}/orders/${orderId}`);
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_status: 'canceled' }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response. Please check backend logs.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error canceling order:', error);
    
    // Return more specific error message
    if (error.message.includes('JSON')) {
      throw new Error('Server error. Please check if the backend is running correctly.');
    }
    throw error;
  }
};