import React, { useEffect, useState, useRef } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  FlatList,
  Animated,
} from "react-native";
import CustomText from "../../components/custom-text";
import { Colors } from "../../constants/theme";
import { API_BASE_URL } from '../../config/config';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from "react-native";
import { router } from "expo-router";

type Product = {
  product_id: number;
  product_name: string;
  price: string;
  image_url: string;
};

const { width: screenWidth } = Dimensions.get("window");

// Banner images array
const BANNER_IMAGES = [
  require("../../assets/images/banner2.png"),
  require("../../assets/images/banner3.png"),
  require("../../assets/images/banner4.png"),
];

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  // const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);


  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.slice(0, 6));
        setLoading(false);
      })
      .catch(() => {
        setError("Lỗi tải sản phẩm");
        setLoading(false);
      });
  }, []);

  // Auto scroll banner every 3 seconds
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      autoScrollTimer.current = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % BANNER_IMAGES.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  const onBannerScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setCurrentBannerIndex(index);
  };

  const navigateToCart = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      Alert.alert('Cart is empty', 'Please log in to view your cart');
      router.push('/signin');
    } else {
      router.push('/cart');
    }
  };

  const navigateToAccountInfo = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      Alert.alert('Not logged in', 'Please log in to view your account');
      router.push('/signin');
    } else {
      router.push('../info_acc');
    }
  };

  const navigateToOrders = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) {
      Alert.alert('Not logged in', 'Please log in to view your orders');
      router.push('/signin');
    } else {
      router.push('../purchaseOrder');
    }
  };

  const renderBannerItem = ({ item }: { item: any }) => (
    <View style={styles.bannerSlide}>
      <Image
        source={item}
        style={styles.banner}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Banner Slider with utility icons */}
      <View style={styles.bannerContainer}>
        <FlatList
          ref={flatListRef}
          data={BANNER_IMAGES}
          renderItem={renderBannerItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onBannerScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, index) => index.toString()}
          onScrollBeginDrag={() => {
            // Stop auto scroll when user starts dragging
            if (autoScrollTimer.current) {
              clearInterval(autoScrollTimer.current);
            }
          }}
          onScrollEndDrag={() => {
            // Restart auto scroll after user stops dragging
            if (autoScrollTimer.current) {
              clearInterval(autoScrollTimer.current);
            }
            autoScrollTimer.current = setInterval(() => {
              setCurrentBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % BANNER_IMAGES.length;
                flatListRef.current?.scrollToIndex({
                  index: nextIndex,
                  animated: true,
                });
                return nextIndex;
              });
            }, 3000);
          }}
        />
        
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {BANNER_IMAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentBannerIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Icon Group - 3 icons in a row */}
        <View style={styles.iconGroup}>
          {/* Account Information Icon */}
          <TouchableOpacity
            style={styles.utilityIcon}
            onPress={navigateToAccountInfo}
          >
            <Ionicons name="person-outline" size={22} color="#000" />
          </TouchableOpacity>

          {/* Order Management Icon */}
          <TouchableOpacity
            style={styles.utilityIcon}
            onPress={navigateToOrders}
          >
            <MaterialIcons name="assignment" size={22} color="#000" />
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.utilityIcon}
            onPress={navigateToCart}
          >
            <Ionicons name="cart" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionDivider} />

      {/* New Arrival */}
      <CustomText style={styles.title}>New Arrival</CustomText>
      <View style={styles.arrivalList}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#b08d2b"
            style={{ marginTop: 40 }}
          />
        ) : error ? (
          <CustomText
            style={{ color: "red", textAlign: "center", marginTop: 40 }}
          >
            {error}
          </CustomText>
        ) : (
          products.map((item, idx) =>
            idx % 2 === 0 && idx < products.length - 1 ? (
              <View key={item.product_id} style={styles.arrivalRow}>
                <ProductCard product={item} />
                {products[idx + 1] && (
                  <ProductCard product={products[idx + 1]} />
                )}
              </View>
            ) : null
          )
        )}
      </View>

      {/* Watch more button */}
      <View style={styles.watchMoreContainer}>
        <TouchableOpacity
          style={styles.watchMoreBtn}
          onPress={() => router.push("/products")}
        >
          <CustomText style={styles.watchMoreText}>See More</CustomText>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.sectionDivider} />

      {/* Instagram Section */}
      <View style={styles.instagramSection}>
        <CustomText style={styles.instagramTitle}>INSTAGRAM</CustomText>
        <CustomText style={styles.instagramSubtitle}>@sixdo.vn</CustomText>

        <View style={styles.instagramGrid}>
          {[
            "https://sixdo.vn/images/banners/mresized/1-1-1746265646.webp",
            "https://sixdo.vn/images/banners/mresized/2-1746264570.webp",
            "https://sixdo.vn/images/banners/mresized/3-1746264580.webp",
            "https://sixdo.vn/images/banners/mresized/b2-1746263619.webp",
            "https://sixdo.vn/images/banners/mresized/b1-1746263630.webp",
            "https://sixdo.vn/images/banners/mresized/b3-1746263639.webp",
            "https://sixdo.vn/images/banners/mresized/a-1746408242.webp",
            "https://sixdo.vn/images/banners/mresized/b-1746408249.webp",
            "https://sixdo.vn/images/banners/mresized/c-1746408256.webp",
          ].map((url, i) => (
            <View key={i} style={styles.instaImageWrapper}>
              <Image 
                source={{ uri: url }} 
                style={styles.instaImage}
                defaultSource={require("../../assets/images/placeholder.png")}
                onError={(error) => console.log(`Image ${i} failed to load:`, error.nativeEvent.error)}
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <TouchableOpacity
      style={styles.arrivalCard}
      onPress={() => router.push(`/product/${product.product_id}`)}
    >
      <Image source={{ uri: product.image_url }} style={styles.arrivalImage} />
      <View style={styles.productInfo}>
        <CustomText style={styles.arrivalName} numberOfLines={2}>
          {product.product_name}
        </CustomText>
        <CustomText style={styles.arrivalPrice}>
          {Number(product.price).toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f3e4",
  },
  bannerContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  bannerSlide: {
    width: screenWidth,
    height: screenWidth * 2,
  },
  banner: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 24,
  },
  // Icon Group - Container cho 3 icons
  iconGroup: {
    position: 'absolute',
    top: 30,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  utilityIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Quicksand",
    color: "#222",
  },
  arrivalList: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  arrivalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  arrivalCard: {
    flex: 1,
    backgroundColor: "#fef7e4",
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "flex-start",
  },
  arrivalImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#e9e4d7",
  },
  productInfo: {
    width: "100%",
    paddingHorizontal: 2,
  },
  arrivalName: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 4,
    textAlign: "left",
    fontFamily: "Quicksand",
    color: "#222",
  },
  arrivalPrice: {
    fontSize: 16,
    color: "#222",
    fontWeight: "bold",
    textAlign: "left",
    fontFamily: "Quicksand",
    marginBottom: 2,
  },
  watchMoreContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  watchMoreBtn: {
    backgroundColor: "#fef7e4",
    borderWidth: 1,
    borderColor: "#000",
    width: "90%",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  watchMoreText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    fontFamily: "Quicksand",
  },
  instagramSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  instagramTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#222",
    fontFamily: "Quicksand",
  },
  instagramSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    color: "#666",
    fontFamily: "Quicksand",
  },
  instagramGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  instaImageWrapper: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#ddd",
    overflow: 'hidden',
  },
  instaImage: {
    width: "100%",
    height: "100%",
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginHorizontal: 16,
    marginBottom: 20,
  },
});