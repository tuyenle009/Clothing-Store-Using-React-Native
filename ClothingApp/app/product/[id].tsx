// app/(tab)/product/[id].tsx
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import CustomText from "../../components/custom-text";
import {
  fetchProductDetail,
  fetchProductDetails,
} from "../../services/productService";
import Header from "../../components/Header";
import { addToCart } from "../../services/cartService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [productDetails, setProductDetails] = useState<any[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const prod = await fetchProductDetail(String(id));
        setProduct(prod);
        const details = await fetchProductDetails(String(id));
        const active = Array.isArray(details)
          ? details.filter((d) => !d.is_deleted)
          : [];
        setProductDetails(active);
        if (active.length > 0) {
          const firstColor = active[0].color;
          setSelectedColor(firstColor);
          const firstDetail = active.find((d) => d.color === firstColor);
          setSelectedDetail(firstDetail);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <ActivityIndicator size="large" color="#b08d2b" style={{ flex: 1 }} />
    );
  if (!product)
    return (
      <CustomText style={{ textAlign: "center", marginTop: 40 }}>
        Product not found
      </CustomText>
    );

  const uniqueColors = [...new Set(productDetails.map((d) => d.color))];
  const availableSizes = productDetails.filter(
    (d) => d.color === selectedColor
  );

  // Hàm lấy user_id từ AsyncStorage
  const getUserId = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.user_id;
  };

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    const user_id = await getUserId();
    if (!user_id) {
      Alert.alert('You need to log in to add items to the cart');
      router.push('/signin');
      return;
    }
    if (!selectedDetail) return;
    const payload = {
      product_id: product.product_id,
      detail_id: selectedDetail.detail_id,
      product_name: product.product_name,
      image_url: selectedDetail.image_url || product.image_url,
      color: selectedDetail.color,
      size: selectedDetail.size,
      price: product.price,
      quantity,
    };
    try {
      console.log('Add to cart payload:', { user_id, ...payload });
      const response = await addToCart(user_id, payload);
      console.log('Add to cart response:', response);
      Alert.alert('Success', 'Item has been added to your cart!');
      // Có thể chuyển sang tab cart hoặc cập nhật badge số lượng
    } catch (err) {
      console.log('Add to cart error:', err);
      Alert.alert('Error', 'Unable to add item to the cart');
    }
  };

  const handleIncreaseQuantity = () => {
    if (selectedDetail && quantity < selectedDetail.stock_quantity) {
      setQuantity((prev) => prev + 1);
    } else {
      // Alert.alert('Error', 'Cannot exceed available stock');
    }
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f3e4" }}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <Header />,
        }}
      />
      <ScrollView style={styles.container}>
        <Image
          source={{ uri: selectedDetail?.image_url || product.image_url }}
          style={styles.mainImage}
        />
        <View style={styles.infoBox}>
          <CustomText style={styles.productName}>
            {product.product_name}
          </CustomText>
          <CustomText style={styles.productId}>
            MSP: {product.product_id}
          </CustomText>
          <CustomText style={styles.price}>
            {Number(product.price).toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </CustomText>
        </View>

        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Color</CustomText>
          <View style={styles.optionsRow}>
            {uniqueColors.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.optionBtn,
                  selectedColor === color && styles.optionBtnActive,
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setSelectedDetail(null);
                }}
              >
                <CustomText style={styles.optionText}>{color}</CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedColor && (
          <View style={styles.section}>
            <CustomText style={styles.sectionTitle}>Size</CustomText>
            <View style={styles.optionsRow}>
              {availableSizes.map((sizeOpt) => (
                <TouchableOpacity
                  key={sizeOpt.detail_id}
                  style={[
                    styles.optionBtn,
                    selectedDetail?.detail_id === sizeOpt.detail_id &&
                      styles.optionBtnActive,
                  ]}
                  onPress={() => setSelectedDetail(sizeOpt)}
                  disabled={sizeOpt.stock_quantity <= 0}
                >
                  <CustomText style={styles.optionText}>
                    {sizeOpt.size}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {/* Description */}
        <View style={styles.section}>
          <CustomText style={styles.sectionTitle}>Description</CustomText>
          <CustomText style={styles.descriptionText}>
            {product.description || "No description available."}
          </CustomText>
        </View>
        {/* Notes & Policies */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setShowNotes((prev) => !prev)}
            style={styles.notesHeader}
          >
            <CustomText style={styles.sectionTitle}>
              Notes & Policies
            </CustomText>
            <CustomText style={{ fontSize: 16 }}>
              {showNotes ? "▲" : "▼"}
            </CustomText>
          </TouchableOpacity>

          {showNotes && (
            <CustomText style={styles.notesText}>
              ⚠️ NOTES{"\n"}- The size chart above is a general reference guide.
              Depending on body measurements, product form, and different fabric
              materials, there may be variations of 1-2cm or more.{"\n\n"}-
              Product colors may slightly differ from actual colors due to
              lighting effects, but quality is guaranteed.{"\n\n"}- SIXDO Online
              does not support product inspection before payment. Therefore,
              please record a video of the product opening process so SIXDO can
              assist you if there are any order issues.{"\n\n"}- SIXDO issues
              red invoices within 24 hours of successful order placement. Please
              contact HOTLINE during business hours: 1800 6650 for invoice
              support.{"\n\n"}
              ❗️ RETURN POLICY{"\n"}
              SIXDO does not support returns under any circumstances.{"\n\n"}
              ❗️ EXCHANGE POLICY{"\n"}- SIXDO Offline Store System: Supports
              exchanges within 06 days from the date of purchase at the
              Showroom.{"\n\n"}- SIXDO Online Store System (Fanpage/Website):
              Supports exchanges within 15 days from the date the Online sale
              creates the order and issues the Bill.{"\n\n"}- Online customers
              please record a video of the product opening process so SIXDO can
              assist you if there are any order issues.{"\n\n"}
              ❗️ EXCHANGE CONDITIONS{"\n"}- Original price items.{"\n"}- Items
              discounted less than 50%.{"\n"}- Original labels, barcodes, unused
              condition.{"\n"}- Must have purchase invoice. If no invoice,
              please contact Hotline 1800 6650 for support.{"\n\n"}
              Contact SIXDO directly for more information and order support.
              Hotline (business hours): 1800 6650
            </CustomText>
          )}
        </View>
      </ScrollView>
      {/* Quantity + Add to Cart in one row */}
      <View style={styles.actionRow}>
        <View style={styles.quantityBox}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleDecreaseQuantity}
          >
            <CustomText style={styles.qtyBtnText}>-</CustomText>
          </TouchableOpacity>

          <CustomText style={styles.qtyValue}>{quantity}</CustomText>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleIncreaseQuantity}
          >
            <CustomText style={styles.qtyBtnText}>+</CustomText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            (!selectedDetail || selectedDetail.stock_quantity < 1) &&
              styles.addBtnDisabled,
          ]}
          disabled={!selectedDetail || selectedDetail.stock_quantity < 1}
          onPress={handleAddToCart}
        >
          <CustomText style={styles.addBtnText}>
            {!selectedColor
              ? "PLEASE SELECT COLOR"
              : !selectedDetail
              ? "PLEASE SELECT SIZE"
              : selectedDetail.stock_quantity < 1
              ? "OUT OF STOCK"
              : "ADD TO CART"}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  mainImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    marginBottom: 16,
    backgroundColor: "#ddd",
  },
  infoBox: { paddingHorizontal: 16, marginBottom: 12 },
  productName: { fontSize: 20, fontWeight: "bold", color: "#222" },
  productId: { fontSize: 14, color: "#666" },
  price: { fontSize: 18, fontWeight: "bold", color: "#222" },
  section: { paddingHorizontal: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap" },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ece9db",
    marginRight: 8,
    marginBottom: 8,
  },
  optionBtnActive: {
    backgroundColor: "#f6f3e4",
    borderWidth: 1,
    borderColor: "#b08d2b",
  },
  optionText: { fontSize: 14, color: "#222" },

  // Row chứa số lượng + nút Add
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 20,
  },

  // Box chứa số lượng
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#fff",
    flex: 1,
    height: 50,
    marginRight: 10,
  },
  qtyBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    backgroundColor: "#fff", // nền trắng tinh
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: 400,
    color: "#000",
  },
  qtyValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: 400,
    color: "#000",
  },

  // Add to cart
  addBtn: {
    flex: 2,
    height: 50,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: { backgroundColor: "#ccc" },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  descriptionText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginTop: 4,
  },
  notesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  notesText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 20,
    marginTop: 8,
  },
});
