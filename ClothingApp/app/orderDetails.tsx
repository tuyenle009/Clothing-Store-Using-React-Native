import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Header from "../components/Header";
import { getOrderDetails, cancelOrder } from '../services/purchaseOrderService';
import CustomText from '../components/custom-text';

interface OrderDetail {
  order_detail_id: number;
  order_id: number;
  quantity: number;
  price: string;
  detail_id: number;
  color: string;
  size: string;
  image_url: string;
  stock_quantity: number;
  product_name: string;
  description: string;
  product_price: string;
  subtotal: number;
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const orderId = params.orderId as string;
  const orderStatus = params.orderStatus as string;
  const totalPrice = params.totalPrice as string;
  const createdAt = params.createdAt as string;

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const details = await getOrderDetails(Number(orderId));
      console.log('Order details:', details); // Debug log
      setOrderDetails(details);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: confirmCancelOrder,
        },
      ]
    );
  };

  const confirmCancelOrder = async () => {
    try {
      setCanceling(true);
      await cancelOrder(Number(orderId));
      Alert.alert('Success', 'Order has been canceled', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error canceling order:', error);
      Alert.alert('Error', 'Failed to cancel order');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0 ₫';
    
    return numPrice.toLocaleString('vi-VN') + ' ₫';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'processing':
        return '#2196F3';
      case 'shipped':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'canceled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const canCancelOrder = orderStatus === 'pending' || orderStatus === 'processing';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => <Header title="Order Details" showBack={true} />,
          }}
        />

        <ScrollView style={styles.scrollView}>
          {/* Order Info Card */}
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoRow}>
              <CustomText style={styles.orderInfoLabel}>Order ID:</CustomText>
              <CustomText style={styles.orderInfoValue}>#{orderId}</CustomText>
            </View>
            <View style={styles.orderInfoRow}>
              <CustomText style={styles.orderInfoLabel}>Status:</CustomText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderStatus) }]}>
                <CustomText style={styles.statusBadgeText}>
                  {orderStatus.toUpperCase()}
                </CustomText>
              </View>
            </View>
            <View style={styles.orderInfoRow}>
              <CustomText style={styles.orderInfoLabel}>Created:</CustomText>
              <CustomText style={styles.orderInfoValue}>{formatDate(createdAt)}</CustomText>
            </View>
            <View style={styles.divider} />
            <View style={styles.orderInfoRow}>
              <CustomText style={styles.orderInfoLabel}>Total Amount:</CustomText>
              <CustomText style={styles.totalPrice}>{formatPrice(totalPrice)}</CustomText>
            </View>
          </View>

          {/* Products List */}
          <View style={styles.sectionHeader}>
            <CustomText style={styles.sectionTitle}>Order Items</CustomText>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <CustomText style={styles.loadingText}>Loading order details...</CustomText>
            </View>
          ) : orderDetails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CustomText style={styles.emptyText}>No items found</CustomText>
            </View>
          ) : (
            orderDetails.map((item) => (
              <View key={item.order_detail_id} style={styles.productCard}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <CustomText style={styles.productName} numberOfLines={2}>
                    {item.product_name}
                  </CustomText>
                  <View style={styles.productVariant}>
                    <CustomText style={styles.variantText}>
                      Color: {item.color} | Size: {item.size}
                    </CustomText>
                  </View>
                  <View style={styles.productPricing}>
                    <CustomText style={styles.productPrice}>
                      {formatPrice(item.price)}
                    </CustomText>
                    <CustomText style={styles.productQuantity}>x{item.quantity}</CustomText>
                  </View>
                  <CustomText style={styles.productSubtotal}>
                    {/* Subtotal: {formatPrice(item.subtotal)} */}
                  </CustomText>
                </View>
              </View>
            ))
          )}

          {/* Cancel Button */}
          {canCancelOrder && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.cancelButton, canceling && styles.disabledButton]}
                onPress={handleCancelOrder}
                disabled={canceling}
              >
                <CustomText style={styles.cancelButtonText}>
                  {canceling ? 'Canceling...' : 'Cancel Order'}
                </CustomText>
              </TouchableOpacity>
            </View>
          )}

          {orderStatus === 'canceled' && (
            <View style={styles.canceledNotice}>
              <CustomText style={styles.canceledNoticeText}>
                This order has been canceled
              </CustomText>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f3e4',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f3e4',
  },
  scrollView: {
    flex: 1,
  },
  orderInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfoLabel: {
    fontSize: 15,
    color: '#666',
  },
  orderInfoValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ece9db',
    marginVertical: 8,
  },
  totalPrice: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  productCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
  },
  productVariant: {
    marginBottom: 6,
  },
  variantText: {
    fontSize: 13,
    color: '#666',
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  productSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  cancelButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  canceledNotice: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 12,
    alignItems: 'center',
  },
  canceledNoticeText: {
    fontSize: 15,
    color: '#c62828',
    fontWeight: '500',
  },
});