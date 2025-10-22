// ClothingApp/services/productService.js
import { API_BASE_URL } from '../config/config';

export const fetchProducts = async () => {
  const res = await fetch(`${API_BASE_URL}/products`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
};

// ✅ Thêm hàm sortProducts (giống logic web)
export const sortProducts = (products, sortOption) => {
  const sortedProducts = [...products];

  switch (sortOption) {
    case 'low-to-high':
      return sortedProducts.sort((a, b) => Number(a.price) - Number(b.price));
    case 'high-to-low':
      return sortedProducts.sort((a, b) => Number(b.price) - Number(a.price));
    case 'newest':
      return sortedProducts.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    default:
      return sortedProducts;
  }
};
// services/productService.js
export const fetchProductDetail = async (id) => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product detail');
  const data = await res.json();
  // backend trả mảng như web -> lấy phần tử đầu nếu cần
  return Array.isArray(data) ? data[0] || null : data;
};

export const fetchProductDetails = async (id) => {
  const res = await fetch(`${API_BASE_URL}/product_details/product/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product details');
  return res.json();
};
