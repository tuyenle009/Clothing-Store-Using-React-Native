import React, { useEffect, useState, useRef } from 'react';
import { 
  Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, 
  ActivityIndicator, SafeAreaView
} from 'react-native';
import ActionSheet from 'react-native-actionsheet';
import CustomText from '../../components/custom-text';
import { fetchProducts, sortProducts } from '../../services/productService';
import { useRouter } from 'expo-router';

const categoryList = [
  { id: 1, name: "Dress" },
  { id: 2, name: "Women's Blazer" },
  { id: 3, name: "Skirt" },
  { id: 4, name: "Women's Pants" },
  { id: 5, name: "Women's Top" },
  { id: 6, name: "T-shirt" },
  { id: 7, name: "Vietnamese Traditional Dress" },
  { id: 8, name: "Trench Coat" },
];

type Product = {
  product_id: number;
  category_id: number;
  product_name: string;
  description: string;
  price: string;
  image_url: string;
  created_at: string;
  is_deleted: number;
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const router = useRouter();
  const actionSheetRef = useRef<ActionSheet>(null);

  const sortOptions = [
    "Newest",
    "Price: Low to High",
    "Price: High to Low",
    "Cancel"
  ];

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then(data => {
        setProducts(data);
        setFilteredProducts(sortProducts(data, sortOption));
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load products');
        setLoading(false);
      });
  }, []);

  const applyFilterAndSort = (option: string, categoryId?: number | null) => {
    const catId = typeof categoryId !== 'undefined' ? categoryId : selectedCategory;
    let results = products;

    if (searchText && searchText.trim()) {
      const keyword = searchText.toLowerCase();
      results = results.filter(p =>
        p.product_name.toLowerCase().includes(keyword)
      );
    }

    if (catId !== null && typeof catId !== 'undefined') {
      results = results.filter(p => Number(p.category_id) === Number(catId));
    }

    setFilteredProducts(sortProducts(results, option));
  };

  const handleSearch = () => {
    applyFilterAndSort(sortOption, selectedCategory);
  };

  const openSortOptions = () => {
    actionSheetRef.current?.show();
  };

  const handleSortPress = (index: number) => {
    if (index === 3) return;
    let selected = sortOption;
    if (index === 0) selected = "newest";
    if (index === 1) selected = "low-to-high";
    if (index === 2) selected = "high-to-low";

    setSortOption(selected);
    applyFilterAndSort(selected);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchIconBtn} onPress={handleSearch}>
              <Image source={require('../../assets/images/search.png')} style={styles.searchIcon} />
            </TouchableOpacity>
          </View>

          {/* Nút filter */}
          <TouchableOpacity style={styles.filterIconBtn} onPress={openSortOptions}>
            <Image source={require('../../assets/images/slider_horizontal.png')} style={styles.filterIcon} />
          </TouchableOpacity>
        </View>

        {/* Category bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryBar}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {categoryList.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  isActive && styles.categoryBtnActive
                ]}
                onPress={() => {
                  const newSelected = isActive ? null : cat.id;
                  setSelectedCategory(newSelected);
                  applyFilterAndSort(sortOption, newSelected);
                }}
              >
                <CustomText
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive
                  ]}
                >
                  {cat.name}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product list */}
        <View style={styles.productList}>
          {loading ? (
            <ActivityIndicator size="large" color="#b08d2b" style={{ marginTop: 40 }} />
          ) : error ? (
            <CustomText style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</CustomText>
          ) : filteredProducts.length === 0 ? (
            <CustomText style={{ textAlign: 'center', marginTop: 40 }}>No products found</CustomText>
          ) : (
            filteredProducts.map((item, idx) => (
              idx % 2 === 0 ? (
                <View key={item.product_id} style={styles.productRow}>
                  <ProductCard 
                    product={item} 
                    onPress={() => router.push(`../product/${item.product_id}` as any )} 
                  />
                  {filteredProducts[idx + 1] && (
                    <ProductCard 
                      product={filteredProducts[idx + 1]} 
                      onPress={() => router.push(`../product/${filteredProducts[idx + 1].product_id}` as any )} 
                    />
                  )}
                </View>
              ) : null
            ))
          )}
        </View>

        {/* ActionSheet component */}
        <ActionSheet
          ref={actionSheetRef}
          title={'Sort Products'}
          options={sortOptions}
          cancelButtonIndex={3}
          onPress={handleSortPress}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, onPress }: { product: Product, onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: product.image_url }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <CustomText style={styles.productName} numberOfLines={2}>{product.product_name}</CustomText>
        <CustomText style={styles.productPrice}>
          {Number(product.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
        </CustomText>
      </View>
    </TouchableOpacity>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 0,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontFamily: 'Quicksand',
    paddingRight: 8,
  },
  searchIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#444',
  },
  filterIconBtn: {
    marginLeft: 12,
    backgroundColor: '#f6f3e4',
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    tintColor: '#444',
  },
  categoryBar: {
    flexGrow: 0,
    marginBottom: 16,
    marginLeft: 8,
  },
  categoryBtn: {
    backgroundColor: '#ece9db',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryBtnActive: {
    backgroundColor: '#f6f3e4',
  },
  categoryText: {
    fontSize: 15,
    color: '#222',
    fontFamily: 'Quicksand',
    fontWeight: 'bold',
  },
  categoryTextActive: {
    color: '#222',
    fontWeight: 'bold',
  },
  productList: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fef7e4',
    borderRadius: 16, 
    padding: 10,
    marginHorizontal: 6,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'flex-start',
  },
  productImage: {
    width: '100%',
    aspectRatio: 3/4,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#e9e4d7',
  },
  productInfo: {
    width: '100%',
    paddingHorizontal: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'left',
    fontFamily: 'Quicksand',
    color: '#222',
  },
  productPrice: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'left',
    fontFamily: 'Quicksand',
    marginBottom: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowIcon: {
    width: 12,
    height: 12,
    resizeMode: 'contain',
    marginLeft: 4,
    tintColor: '#222',
  },
});