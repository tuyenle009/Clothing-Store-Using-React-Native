import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import { API_BASE_URL } from '../config/config';


// API endpoints
const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  PROFILE: `${API_BASE_URL}/user/profile`,
};

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  // Check stored data in AsyncStorage
  const checkStoredData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userDataString = await AsyncStorage.getItem("user");
      const userData = userDataString ? JSON.parse(userDataString) : null;
      console.log("Stored Token:", token);
      console.log("Stored User Data:", userData);
    } catch (error) {
      console.error("Error checking AsyncStorage:", error);
    }
  };

  // Validate login input
  const validateLogin = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    // Check if fields are empty
    if (!email) {
      setEmailError("Please enter an email address or mobile number");
      isValid = false;
    }
    if (!password) {
      setPasswordError("Please enter a password");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    // Validate input before API call
    if (!validateLogin()) {
      return;
    }

    setLoading(true);
    setEmailError("");
    setPasswordError("");

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to AsyncStorage
        await AsyncStorage.setItem("token", data.token);

        // Fetch profile data
        try {
          const profileResponse = await fetch(API_ENDPOINTS.PROFILE, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const profileData = await profileResponse.json();

          let userData;
          if (profileResponse.ok && profileData.user) {
            userData = {
              user_id: data.user.user_id,
              full_name: data.user.full_name,
              email: data.user.email,
              phone: profileData.user.phone || "",
              address: profileData.user.address || "",
              role: data.user.role,
            };
          } else {
            userData = {
              user_id: data.user.user_id,
              full_name: data.user.full_name,
              email: data.user.email,
              phone: "",
              address: "",
              role: data.user.role,
            };
          }

          // Save userData to AsyncStorage
          await AsyncStorage.setItem("user", JSON.stringify(userData));
          console.log("Saved user:", userData);

          // Check stored data
          await checkStoredData();

          // Navigate based on role
          if (userData.role === "admin") {
            router.push("/");
          } else {
            router.push("/");
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
          // Save basic user data if profile fetch fails
          const basicUserData = {
            user_id: data.user.user_id,
            full_name: data.user.full_name,
            email: data.user.email,
            phone: "",
            address: "",
            role: data.user.role,
          };
          await AsyncStorage.setItem("user", JSON.stringify(basicUserData));
          console.log("Saved basic user data:", basicUserData);

          // Check stored data
          await checkStoredData();

          router.push("../(tabs)/index");
        }
      } else {
        // Display error for login failure
        if (data.error?.code === "INVALID_PASSWORD") {
          setPasswordError("The password that you've entered is incorrect.");
        } else {
          setPasswordError("Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setPasswordError("An error occurred while logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
    options={{
      headerShown: true,
      header: () => (
        <Header
          showBack={true}
          onBack={() => router.replace("/(tabs)/profile")} // Navigate to profile page
        />
      ),
    }}
  />

      {/* Form Login */}
      <View style={styles.form}>
        {/* User icon */}
        <Ionicons
          name="person-circle"
          size={100}
          color="#000"
          style={styles.userIcon}
        />

        {/* Email input */}
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Email / Phone number"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(""); // Clear error on input change
          }}
          placeholderTextColor="#666"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Password input */}
        <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError(""); // Clear error on input change
            }}
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
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign In button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>LOG IN</Text>
          )}
        </TouchableOpacity>

        {/* Sign Up link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f5e7",
  },
  form: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  userIcon: {
    alignSelf: "center",
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderBottomColor: "#ff0000", // Red border for error
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 10,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 12,
    marginBottom: 10,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotText: {
    color: "#444",
    fontSize: 14,
  },
  loginBtn: {
    backgroundColor: "#222",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
    color: "#444",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
});