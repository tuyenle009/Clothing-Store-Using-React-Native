import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserOrders } from "../services/purchaseOrderService";
import CustomText from "../components/custom-text";

interface Order {
  order_id: number;
  user_id: number;
  total_price: number;
  order_status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  created_at: string | Date;
  is_deleted: boolean;
}

export default function PurchaseOrderScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Hàm fetch orders - tách riêng để tái sử dụng
  const fetchOrders = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        console.log("User not found");
        return;
      }

      const user = JSON.parse(userData);
      const userOrders = await getUserOrders(user.user_id);

      // Filter orders by user ID
      const filteredOrders = userOrders.filter(
        (order: Order) => order.user_id === user.user_id
      );
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Load lần đầu
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };
    loadOrders();
  }, []);

  // ✅ Reload mỗi khi quay lại trang này
  useFocusEffect(
    React.useCallback(() => {
      // Chỉ reload nếu đã load xong lần đầu
      if (!loading) {
        console.log("Screen focused - reloading orders...");
        fetchOrders();
      }
    }, [loading])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders
    .filter((order) => order.order_status === activeStatus)
    .sort((a, b) => b.order_id - a.order_id);

  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const handleOrderPress = (order: Order) => {
    const dateStr =
      typeof order.created_at === "string"
        ? order.created_at
        : order.created_at.toISOString();

    router.push({
      pathname: "/orderDetails",
      params: {
        orderId: order.order_id.toString(),
        orderStatus: order.order_status,
        totalPrice: order.total_price.toString(),
        createdAt: dateStr,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => <Header title="Purchase Order" showBack={true} />,
          }}
        />

        {/* Order Status Tabs */}
        <View style={styles.statusContainer}>
          {["pending", "processing", "shipped", "delivered", "canceled"].map(
            (status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setActiveStatus(status)}
                style={styles.statusItem}
              >
                <CustomText
                  style={[
                    styles.statusText,
                    activeStatus === status && styles.activeStatus,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </CustomText>
                {activeStatus === status && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Product Items with Pull to Refresh */}
        <ScrollView
          style={styles.itemsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#000"]}
              tintColor="#000"
            />
          }
        >
          {loading ? (
            <CustomText style={styles.emptyText}>Loading orders...</CustomText>
          ) : filteredOrders.length === 0 ? (
            <CustomText style={styles.emptyText}>No orders found</CustomText>
          ) : (
            filteredOrders.map((order) => (
              <TouchableOpacity
                key={order.order_id}
                style={styles.itemBox}
                onPress={() => handleOrderPress(order)}
                activeOpacity={0.7}
              >
                <CustomText style={styles.itemText}>
                  Order ID: #{order.order_id}
                </CustomText>
                <CustomText style={styles.itemText}>
                  Total:{" "}
                  {Number(order.total_price).toLocaleString("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  })}
                </CustomText>
                <CustomText style={styles.itemText}>
                  Created: {formatDate(order.created_at)}
                </CustomText>
                <View style={styles.statusBadge}>
                  <CustomText style={styles.statusBadgeText}>
                    {order.order_status.toUpperCase()}
                  </CustomText>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f3e4",
  },
  container: {
    flex: 1,
    backgroundColor: "#f6f3e4",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#ece9db",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  activeStatus: {
    color: "#000",
    fontWeight: "bold",
  },
  activeIndicator: {
    height: 3,
    backgroundColor: "#000",
    width: "80%",
    marginTop: 8,
    borderRadius: 2,
  },
  itemsContainer: {
    padding: 16,
  },
  itemBox: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: 15,
    color: "#222",
    marginBottom: 6,
  },
  statusBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 40,
  },
});
