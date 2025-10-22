import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header"; // Giả sử bạn có component Header giống signin
import { API_BASE_URL } from '../config/config';


const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
};

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    setError(""); // clear lỗi cũ

    if (!fullName || !email || !password || !phone || !address) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone,
          address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng ký thành công -> chuyển sang login
        router.push("/signin");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred while registering.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <Header />,
        }}
      />

      <View style={styles.form}>
        <Ionicons
          name="person-add"
          size={75}
          color="#000"
          style={styles.icon}
        />

        <Text style={styles.subtitle}>It's quick and easy.</Text>

        {/* Full Name */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#666"
        />

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#666"
          keyboardType="email-address"
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            placeholderTextColor="#666"
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Ionicons
              name={secureText ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#444"
            />
          </TouchableOpacity>
        </View>

        {/* Phone */}
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />

        {/* Address */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
        />

        {/* Hiển thị lỗi */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Sign Up button */}
        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        {/* Sign In link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signin")}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f5e7",
  },
  form: {
    padding: 20,
    justifyContent: "center",
  },
  icon: {
    alignSelf: "center",
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  signUpBtn: {
    backgroundColor: "#222",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  signUpText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  signInText: {
    fontSize: 14,
    color: "#444",
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
});
