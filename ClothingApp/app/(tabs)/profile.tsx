import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather, Entypo } from '@expo/vector-icons';
import CustomText from '../../components/custom-text';
import { Colors } from '../../constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const menuItems = [
  { 
    icon: <Ionicons name="person-outline" size={24} color="#444" />, 
    label: 'Account Information', 
    route: '../info_acc' 
  },
  { 
    icon: <MaterialIcons name="assignment" size={24} color="#444" />, 
    label: 'Order Management',
    route: '../purchaseOrder'
  },
  { 
    icon: <Entypo name="location-pin" size={24} color="#444" />, 
    label: 'Address',
    route: '/address'
  },
  { 
    icon: <Ionicons name="star-outline" size={24} color="#444" />, 
    label: 'Your Cart',
    route: '/cart'
  },
  { 
    icon: <Feather name="bell" size={24} color="#444" />, 
    label: 'Notifications',
    route: '/notifications'
  },
  { 
    icon: <Ionicons name="information-circle-outline" size={24} color="#444" />, 
    label: 'SIXCLUB Policy',
    route: '/policy'
  },
  { 
    icon: <MaterialIcons name="logout" size={24} color="#b08d2b" />, 
    label: 'Logout', 
    logout: true 
  },
];

type User = {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Hàm fetch user - tách riêng để tái sử dụng
  const fetchUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('User data loaded:', userData.full_name); // Debug log
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error loading user data:', e);
      setUser(null);
    }
  };

  // Load lần đầu khi component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // ✅ Reload mỗi khi quay lại trang profile
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused - reloading user data...');
      fetchUserData();
    }, [])
  );

  const handleSignInSignUp = () => {
    router.push('/signin');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setUser(null);
              router.replace('/signin');
            } catch (e) {
              console.error('Error during logout:', e);
              router.replace('/signin');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.headerUnauth}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person-circle-outline" size={64} color="#ccc" />
          </View>
          <View style={styles.welcomeWrap}>
            <CustomText style={styles.welcome}>
              Hello, welcome to Sixdo
            </CustomText>
            {user && user.full_name ? (
              <CustomText style={styles.userName}>{user.full_name}</CustomText>
            ) : null}
            {!user && (
              <TouchableOpacity onPress={handleSignInSignUp}>
                <CustomText style={styles.subText}>Sign in / Sign up</CustomText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.menuWrap}>
          {menuItems.map((item, idx) => {
            if (item.logout && !user) return null; // Ẩn nút logout nếu chưa đăng nhập
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, item.logout && styles.logoutItem]}
                onPress={
                  item.logout
                    ? handleLogout
                    : item.route
                      ? () => router.push(item.route as any)
                      : undefined
                }
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <CustomText style={[styles.menuLabel, item.logout && styles.logoutLabel]}>{item.label}</CustomText>
                <Ionicons name="chevron-forward" size={20} color="#bbb" style={styles.chevron} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  headerUnauth: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f6f3e4',
  },
  avatarWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ece9db',
  },
  welcomeWrap: {
    flex: 1,
    marginRight: 12,
  },
  welcome: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 4,
  },
  subText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.6,
  },
  menuWrap: {
    marginTop: 10,
    backgroundColor: '#f6f3e4',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ece9db',
    backgroundColor: '#fff',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  logoutItem: {
    backgroundColor: '#f9f5e7',
  },
  logoutLabel: {
    color: '#b08d2b',
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 18,
    marginTop: 2,
  },
});