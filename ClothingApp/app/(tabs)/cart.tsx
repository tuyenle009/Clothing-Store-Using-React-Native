import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import CustomText from "../../components/custom-text";
import {
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart,
} from "../../services/cartService";
import { fetchProductDetail } from "../../services/productService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserId = async () => {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return null;
    const user = JSON.parse(userData);
    console.log("User ID:", user.user_id);
    return user.user_id;
  };

  const fetchCart = async () => {
    console.log("=== Fetching Cart ===");
    setLoading(true);
    const user_id = await getUserId();
    if (!user_id) {
      console.log("No user_id found");
      setCart([]);
      setLoading(false);
      return;
    }

    try {
      let items = await getCart(user_id);
      console.log("Raw cart items from API:", JSON.stringify(items, null, 2));

      if (!items || !Array.isArray(items)) {
        console.log("Items is not an array, setting to empty");
        items = [];
      }

      console.log("Number of items:", items.length);

      // Cache product detail
      const productCache: { [key: string]: any } = {};
      const updatedItems = await Promise.all(
        items.map(async (item: any) => {
          console.log("Processing item:", item);

          // Map field names to match JSX expectations
          const mappedItem = {
            ...item,
            product_name: item.name || item.product_name,
            image_url: item.image_url || item.image,
          };

          console.log("Mapped item:", mappedItem);

          if (!mappedItem.image_url && mappedItem.product_id) {
            if (productCache[mappedItem.product_id]) {
              return {
                ...mappedItem,
                image_url:
                  productCache[mappedItem.product_id].image_url || null,
              };
            }
            try {
              const product = await fetchProductDetail(mappedItem.product_id);
              console.log("Fetched product detail:", product);
              productCache[mappedItem.product_id] = product;
              return { ...mappedItem, image_url: product?.image_url || null };
            } catch (err) {
              console.log("Error fetching product detail:", err);
              return mappedItem;
            }
          }
          return mappedItem;
        })
      );

      console.log(
        "Final updated items:",
        JSON.stringify(updatedItems, null, 2)
      );
      setCart(updatedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const handleRemove = async (cartItemId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));

    try {
      await removeFromCart(cartItemId);
    } catch (err) {
      Alert.alert("Error", "Xóa sản phẩm thất bại");
      fetchCart();
    }
  };

  const handleUpdateQty = async (
    cartItemId: number,
    qty: number,
    productId: number
  ) => {
    if (qty < 1) return;

    const item = cart.find((i) => i.id === cartItemId);
    if (!item) return;

    // Nếu vượt quá số lượng trong kho → chỉ cảnh báo, KHÔNG gọi API
    if (qty > item.stock_quantity) {
      return;
    }

    // ✅ Cập nhật local state ngay để UI phản hồi nhanh
    setCart((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, quantity: qty } : i))
    );

    // ✅ Gửi lên server cập nhật (chỉ khi hợp lệ)
    try {
      const user_id = await getUserId();
      const res = await updateCartItem(cartItemId, user_id, productId, qty);

      // Kiểm tra phản hồi server có hợp lệ không
      if (!res || !res.success) {
        console.log("Update failed response:", res);
        // Nếu server trả lỗi thì khôi phục lại dữ liệu thật
        fetchCart();
        return;
      }
    } catch (err) {
      console.log("Update error:", err);
      // Không hiện alert "Error" cho người dùng vì không phải lỗi nghiêm trọng
      fetchCart();
    }
  };

  const handleClearCart = async () => {
    Alert.alert("Clear Cart", "Remove all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          setCart([]);
          try {
            const user_id = await getUserId();
            await clearCart(user_id);
          } catch (err) {
            Alert.alert("Error", "Xóa giỏ hàng thất bại");
            fetchCart();
          }
        },
      },
    ]);
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const shippingFee = 25000;
  const grandTotal = total + shippingFee;
  const subtotal = total;

  console.log("Rendering cart with", cart.length, "items");
  console.log("Loading state:", loading);

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f3e4" }}>
      <View style={{ flex: 1, paddingTop: 20 }}>
        <CustomText style={styles.title}>Your Cart</CustomText>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#b08d2b"
            style={{ marginTop: 40 }}
          />
        ) : cart.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <CustomText style={{ textAlign: "center" }}>
              Your cart is empty
            </CustomText>
            <CustomText
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#666",
                marginTop: 8,
              }}
            >
              Debug: Check console logs for details
            </CustomText>
          </View>
        ) : (
          <ScrollView style={styles.cartList}>
            {cart.map((item) => {
              console.log("Rendering cart item:", item.id, item.product_name);
              return (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.imageWrapper}>
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.productImage}
                        resizeMode="cover"
                        onError={(error) => {
                          console.log(
                            `Failed to load image for product ${item.product_id}:`,
                            error.nativeEvent.error
                          );
                        }}
                      />
                    ) : (
                      <View style={styles.noImagePlaceholder}>
                        <CustomText style={styles.noImageText}>
                          No image
                        </CustomText>
                      </View>
                    )}
                  </View>
                  <View style={styles.infoBox}>
                    <CustomText style={styles.productName}>
                      {item.product_name || "Unknown Product"}
                    </CustomText>
                    <CustomText style={styles.productDetail}>
                      Color: {item.color || "N/A"} | Size: {item.size || "N/A"}
                    </CustomText>
                    <CustomText style={styles.productPrice}>
                      {Number(item.price || 0).toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      })}
                    </CustomText>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleUpdateQty(
                            item.id,
                            item.quantity - 1,
                            item.product_id
                          )
                        }
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <CustomText style={styles.qtyValue}>
                        {item.quantity || 0}
                      </CustomText>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() =>
                          handleUpdateQty(
                            item.id,
                            item.quantity + 1,
                            item.product_id
                          )
                        }
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => handleRemove(item.id)}
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <CustomText style={styles.summaryText}>Subtotal:</CustomText>
            <CustomText style={styles.summaryValue}>
              {total.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </CustomText>
          </View>

          <View style={styles.summaryRow}>
            <CustomText style={styles.summaryText}>Shipping Fee:</CustomText>
            <CustomText style={styles.summaryValue}>
              {shippingFee.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </CustomText>
          </View>

          <View style={styles.grandTotalSeparator} />

          <View style={styles.summaryRow}>
            <CustomText style={styles.summaryText}>Grand Total:</CustomText>
            <CustomText style={styles.summaryValue}>
              {grandTotal.toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </CustomText>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            subtotal === 0 && styles.checkoutBtnDisabled,
          ]}
          onPress={() => {
            if (subtotal > 0) {
              router.push("../payment");
            } else {
              Alert.alert(
                "Error",
                "Your cart is empty. Add items before proceeding to checkout."
              );
            }
          }}
          disabled={subtotal === 0}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f3e4" },
  title: { fontSize: 22, fontWeight: "400", margin: 16, textAlign: "center" },
  cartList: { flex: 1, paddingHorizontal: 8 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 14,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  imageWrapper: {
    width: 60,
    aspectRatio: 3 / 4,
    borderRadius: 6,
    marginRight: 16,
    backgroundColor: "#e9e4d7",
    overflow: "hidden",
    alignSelf: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  noImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  noImageText: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  infoBox: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 16, fontWeight: "400", color: "#222" },
  productDetail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
    fontWeight: "400",
  },
  productPrice: {
    fontSize: 15,
    color: "#222",
    fontWeight: "bold",
    marginBottom: 4,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  qtyBtn: {
    backgroundColor: "#ece9db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: { fontSize: 18, color: "#222", fontWeight: "400" },
  qtyValue: {
    fontSize: 16,
    marginHorizontal: 10,
    minWidth: 24,
    textAlign: "center",
    fontWeight: "400",
  },
  removeBtn: {
    marginLeft: 12,
    backgroundColor: "#f9d6d5",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeBtnText: { color: "#b00020", fontWeight: "400" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#ece9db",
    backgroundColor: "#fff",
  },
  summaryBox: {
    marginBottom: 12,
    paddingTop: 0,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  grandTotalSeparator: {
    borderTopWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
  },
  summaryText: {
    fontSize: 15,
    color: "#222",
    fontWeight: "400",
  },
  summaryValue: {
    fontSize: 15,
    color: "#222",
    fontWeight: "bold",
  },
  checkoutBtn: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkoutBtnDisabled: {
    backgroundColor: "#ccc",
  },
  checkoutBtnText: { color: "#fff", fontWeight: "500", fontSize: 16 },
});
