import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomText from "../components/custom-text";
import Header from "../components/Header";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserInfo, updateUserPassword } from "../services/infoService";

export default function InfoAccScreen() {
  const router = useRouter();
  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState({
    user_id: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [editableUser, setEditableUser] = useState({ ...user });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states for inline validation
  const [fieldErrors, setFieldErrors] = useState({
    full_name: "",
    email: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDataString = await AsyncStorage.getItem("user");
        if (userDataString) {
          const parsedUser = JSON.parse(userDataString);
          setUser(parsedUser);
          setEditableUser(parsedUser);
        }
      } catch (e) {
        Alert.alert("Error", "Failed to load user data");
      }
    };
    fetchUser();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSavePersonalInfo = async () => {
    // Clear previous errors
    setFieldErrors({
      full_name: "",
      email: "",
      phone: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    let hasError = false;

    // Validation
    if (!editableUser.full_name.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        full_name: "Full name is required",
      }));
      hasError = true;
    }

    if (!editableUser.email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required" }));
      hasError = true;
    } else if (!validateEmail(editableUser.email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      hasError = true;
    }

    if (editableUser.phone && !validatePhone(editableUser.phone)) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: "Please enter a valid phone number (10-11 digits)",
      }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const updatedInfo = {
        full_name: editableUser.full_name,
        email: editableUser.email,
        phone: editableUser.phone,
        address: editableUser.address,
      };

      await updateUserInfo(user.user_id, updatedInfo);

      // Update local storage
      const updatedUser = { ...user, ...updatedInfo };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      Alert.alert("Success", "Personal information updated successfully");
    } catch (error) {
      // Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if token expired
      if (errorMessage.includes("Token") || errorMessage.includes("token")) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.clear();
                router.replace("/signin");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          errorMessage ||
            "Failed to update personal information. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Clear previous errors
    setFieldErrors((prev) => ({
      ...prev,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));

    let hasError = false;

    // Validation
    if (!oldPassword.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        oldPassword: "Old password is required",
      }));
      hasError = true;
    }

    if (!newPassword.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: "New password is required",
      }));
      hasError = true;
    } else if (newPassword.length < 6) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: "Password must be at least 6 characters long",
      }));
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Please confirm your password",
      }));
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      hasError = true;
    }

    if (oldPassword && newPassword && oldPassword === newPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: "New password must be different from old password",
      }));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await updateUserPassword(user.user_id, oldPassword, newPassword);

      // Clear password fields
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);

      Alert.alert("Success", "Password changed successfully");
    } catch (error) {
      // Type-safe error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if token expired
      if (errorMessage.includes("Token") || errorMessage.includes("token")) {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.clear();
                router.replace("/signin");
              },
            },
          ]
        );
      } else if (errorMessage.toLowerCase().includes("old password")) {
        // Display inline error for old password
        setFieldErrors((prev) => ({
          ...prev,
          oldPassword: "Old password is incorrect",
        }));
      } else if (errorMessage.toLowerCase().includes("password")) {
        // Generic password error
        setFieldErrors((prev) => ({ ...prev, newPassword: errorMessage }));
      } else {
        Alert.alert(
          "Error",
          errorMessage || "Failed to change password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditableUser(user);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({
      full_name: "",
      email: "",
      phone: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <Header title="Account Information" showBack={true} />
            ),
          }}
        />

        <ScrollView
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Personal Info Section */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPersonalInfo(!showPersonalInfo)}
          >
            <CustomText style={styles.sectionTitle}>PERSONAL INFO</CustomText>
            <Ionicons
              name={showPersonalInfo ? "chevron-up" : "chevron-down"}
              size={20}
              color="#444"
            />
          </TouchableOpacity>

          {showPersonalInfo && (
            <View style={styles.sectionContent}>
              <CustomText style={styles.label}>Full Name</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.full_name && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={editableUser.full_name}
                  onChangeText={(text) => {
                    setEditableUser((prev) => ({ ...prev, full_name: text }));
                    clearFieldError("full_name");
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#999"
                />
              </View>
              {fieldErrors.full_name ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.full_name}
                </CustomText>
              ) : null}

              <CustomText style={styles.label}>Email</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.email && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={editableUser.email}
                  editable={false} // chỉ khóa nhập, không đổi màu
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {fieldErrors.email ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.email}
                </CustomText>
              ) : null}

              <CustomText style={styles.label}>Phone</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.phone && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={editableUser.phone}
                  editable={false} // tương tự
                  placeholder="Enter your phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              {fieldErrors.phone ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.phone}
                </CustomText>
              ) : null}

              <CustomText style={styles.label}>Address</CustomText>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={editableUser.address}
                  onChangeText={(text) =>
                    setEditableUser((prev) => ({ ...prev, address: text }))
                  }
                  placeholder="Enter your address"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <CustomText style={styles.cancelBtnText}>Cancel</CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={handleSavePersonalInfo}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <CustomText style={styles.saveBtnText}>
                      Save Changes
                    </CustomText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Change Password Section */}
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <CustomText style={styles.sectionTitle}>CHANGE PASSWORD</CustomText>
            <Ionicons
              name={showChangePassword ? "chevron-up" : "chevron-down"}
              size={20}
              color="#444"
            />
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.sectionContent}>
              {/* Old password */}
              <CustomText style={styles.label}>Old Password</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.oldPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter old password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    clearFieldError("oldPassword");
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Ionicons
                    name={showOldPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.oldPassword ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.oldPassword}
                </CustomText>
              ) : null}

              {/* New password */}
              <CustomText style={styles.label}>New Password</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.newPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min 6 characters)"
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    clearFieldError("newPassword");
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.newPassword ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.newPassword}
                </CustomText>
              ) : null}

              {/* Confirm password */}
              <CustomText style={styles.label}>Confirm Password</CustomText>
              <View
                style={[
                  styles.inputRow,
                  fieldErrors.confirmPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearFieldError("confirmPassword");
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword ? (
                <CustomText style={styles.errorText}>
                  {fieldErrors.confirmPassword}
                </CustomText>
              ) : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={handleCancel}
                  disabled={loading}
                >
                  <CustomText style={styles.cancelBtnText}>Cancel</CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <CustomText style={styles.saveBtnText}>
                      Change Password
                    </CustomText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Extra padding at bottom for keyboard */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#222",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fffaf0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#444",
  },
  sectionContent: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 45,
    fontSize: 15,
    color: "#222",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
  },
  cancelBtn: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#222",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
