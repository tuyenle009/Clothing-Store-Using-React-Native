import React, { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import Header from "../components/Header";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import CustomText from "../components/custom-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPaymentDetails,
  getUserInfo,
  createOrder,
  createOrderDetails,
  clearUserCart,
} from "../services/paymentService";

interface UserInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

interface CartItem {
  detail_id: string | number;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

export default function PaymentScreen() {
  const [paymentDetails, setPaymentDetails] = useState<{
    cart: CartItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
  }>({
    cart: [],
    subtotal: 0,
    shippingFee: 25000,
    total: 0,
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const router = useRouter();

  const getUserId = async () => {
    const userData = await AsyncStorage.getItem("user");
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.user_id;
  };

  const fetchPaymentData = async () => {
    try {
      const user_id = await getUserId();
      if (!user_id) {
        Alert.alert("Error", "User not found");
        return;
      }

      const paymentData = await getPaymentDetails();
      const userData = await getUserInfo();

      setPaymentDetails(paymentData);
      setUserInfo(userData);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch payment details");
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const handleCheckout = async () => {
    try {
      const user_id = await getUserId();
      if (!user_id) {
        Alert.alert("Error", "User not found");
        return;
      }

      // ✅ Validate cart
      if (paymentDetails.cart.length === 0) {
        Alert.alert("Error", "Your cart is empty");
        return;
      }

      const invalidItems = paymentDetails.cart.filter(
        (item) => !item.detail_id || item.quantity <= 0 || item.price <= 0
      );
      
      if (invalidItems.length > 0) {
        console.error("❌ Invalid cart items:", JSON.stringify(invalidItems, null, 2));
        Alert.alert("Error", "Some cart items have invalid data");
        return;
      }

      console.log("🛒 Cart before checkout:", JSON.stringify(paymentDetails.cart, null, 2));

      // ✅ Tạo đơn hàng
      const orderData = {
        user_id,
        total_price: paymentDetails.total,
        order_status: "pending",
        created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        is_deleted: false,
      };

      console.log("📦 Creating order:", JSON.stringify(orderData, null, 2));
      const orderResponse = await createOrder(orderData);
      console.log("✅ Order created:", orderResponse);

      // ✅ Tạo chi tiết đơn hàng
      const orderDetailsPromises = paymentDetails.cart.map((item, index) => {
        const rawPrice = parseFloat(String(item.price));
        const formattedPrice = rawPrice / 100;
        
        const orderDetailData = {
          order_id: Number(orderResponse.order_id),
          detail_id: Number(item.detail_id),
          quantity: Number(item.quantity),
          price: formattedPrice
        };

        console.log(`📝 Order detail #${index + 1}:`, JSON.stringify(orderDetailData, null, 2));
        return createOrderDetails(orderDetailData);
      });

      await Promise.all(orderDetailsPromises);
      console.log("✅ All order details created");

      // ✅ XÓA CART TỪ DATABASE (quan trọng nhất!)
      console.log("🗑️ Clearing cart from database for user:", user_id);
      await clearUserCart(user_id);
      console.log("✅ Cart cleared from database");

      // ✅ Xóa cart từ AsyncStorage (local)
      await AsyncStorage.removeItem("cart");
      console.log("✅ Cart cleared from AsyncStorage");

      // ✅ Trigger cart update event (nếu có)
      // Tương tự web: window.dispatchEvent(new CustomEvent('cartUpdated'))
      // Trong React Native có thể dùng EventEmitter hoặc Context API

      Alert.alert("Success", "Order placed successfully!", [
        {
          text: "OK",
          onPress: () => router.push("./")
        }
      ]);

    } catch (error) {
      console.error("❌ Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete checkout";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <Header title="Payment" showBack={true} />,
        }}
      />

      <View style={styles.summaryBox}>
        <CustomText style={styles.summaryText}>Subtotal:</CustomText>
        <CustomText style={styles.summaryValue}>
          {paymentDetails.subtotal.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </CustomText>

        <CustomText style={styles.summaryText}>Shipping Fee:</CustomText>
        <CustomText style={styles.summaryValue}>
          {paymentDetails.shippingFee.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </CustomText>

        <View style={styles.separator} />

        <CustomText style={styles.summaryText}>Total:</CustomText>
        <CustomText style={styles.summaryValue}>
          {paymentDetails.total.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </CustomText>
      </View>

      <View style={styles.section}>
        <CustomText style={styles.sectionTitle}>Order Information</CustomText>
        {userInfo && (
          <View>
            <CustomText style={styles.infoText}>
              Name: {userInfo.full_name}
            </CustomText>
            <CustomText style={styles.infoText}>
              Email: {userInfo.email}
            </CustomText>
            <CustomText style={styles.infoText}>
              Phone: {userInfo.phone}
            </CustomText>
            <CustomText style={styles.infoText}>
              Address: {userInfo.address}
            </CustomText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <CustomText style={styles.sectionTitle}>Payment Method</CustomText>
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === "COD" && styles.selectedOption,
          ]}
          onPress={() => setPaymentMethod("COD")}
        >
          <CustomText style={styles.paymentText}>Cash on Delivery</CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentOption, styles.disabledOption]}
          disabled={true}
        >
          <CustomText style={[styles.paymentText, styles.disabledText]}>
            Online Payment via Payoo
          </CustomText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f3e4", padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "400",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: { fontSize: 16, color: "#222", fontWeight: "400" },
  summaryValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "bold",
    textAlign: "right",
  },
  separator: {
    borderTopWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
  },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "400", marginBottom: 8 },
  paymentOption: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: "#b08d2b",
    backgroundColor: "#f9f4e7",
  },
  disabledOption: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ccc",
  },
  paymentText: { fontSize: 16, color: "#222", fontWeight: "400" },
  disabledText: {
    color: "#aaa",
  },
  checkoutBtn: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkoutBtnText: { color: "#fff", fontWeight: "500", fontSize: 16 },
  infoText: { fontSize: 14, color: "#222", fontWeight: "400" },
});