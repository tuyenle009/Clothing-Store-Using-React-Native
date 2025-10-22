import { API_BASE_URL } from '../config/config';

// Lấy giỏ hàng từ server theo user_id
export const getCart = async (user_id) => {
  const res = await fetch(`${API_BASE_URL}/cart?user_id=${user_id}`);
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (user_id, item) => {
  const payload = {
    user_id,
    product_id: item.product_id,
    detail_id: item.detail_id ?? item.product_id,
    quantity: item.quantity
  };
  const res = await fetch(`${API_BASE_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
};

// Xóa sản phẩm khỏi giỏ hàng (theo id trong cart)
// export const removeFromCart = async (id) => {
//   const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
//     method: 'DELETE'
//   });
//   if (!res.ok) throw new Error('Failed to remove from cart');
//   return res.json();
// };
export const removeFromCart = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
      method: 'DELETE',
    });

    // Nếu server trả 204 (No Content), vẫn xem như thành công
    if (res.status === 204) {
      return { status: 204, success: true };
    }

    // Nếu không phải 204, thử parse JSON (nếu có)
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null; // không crash nếu server không có body
    }

    return {
      status: res.status,
      success: res.ok,
      data,
    };
  } catch (error) {
    console.error("removeFromCart error:", error);
    return { status: 500, success: false, error };
  }
};

// Cập nhật số lượng sản phẩm trong giỏ (theo id trong cart)
export const updateCartItem = async (id, user_id, product_id, quantity) => {
  const payload = { user_id, product_id, quantity };
  const res = await fetch(`${API_BASE_URL}/cart/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update cart item');
  return res.json();
};

// Xóa toàn bộ giỏ hàng theo user_id
export const clearCart = async (user_id) => {
  // Lấy toàn bộ giỏ hàng
  const cart = await getCart(user_id);

  // Xóa từng item theo id
  const deletePromises = cart.map(item => removeFromCart(item.id));
  await Promise.all(deletePromises);

  return true;
};
