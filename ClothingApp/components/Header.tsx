import React from "react";
import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Use expo-router's useRouter
import { Platform, StatusBar } from "react-native";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void; // Callback for custom back behavior
  rightIcon?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = true, onBack, rightIcon }) => {
  const router = useRouter(); // Use expo-router's useRouter

  return (
    <View style={styles.header}>
      {/* Back button (hidden if showBack is false) */}
      {showBack ? (
        <TouchableOpacity
          onPress={onBack || (() => router.back())} // Default to previous page
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} /> // Placeholder for layout balance
      )}

      {/* Logo or Title */}
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <Image
          source={{ uri: "https://sixdo.vn/images/logo.svg" }}
          style={styles.logo}
          resizeMode="contain"
        />
      )}

      {/* Right icon (if provided) */}
      {rightIcon ? rightIcon : <View style={{ width: 24 }} />}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f9f5e7",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  logo: {
    width: 120,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "400",
    color: "#222",
    textAlign: "center",
    flex: 1,
    fontFamily: "Quicksand",
  },
});