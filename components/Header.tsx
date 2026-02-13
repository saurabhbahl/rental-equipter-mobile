/**
 * HEADER
 * Top bar with logo centered. Optionally shows a back button on the left (used on the rental screen).
 * Uses safe area insets so content is below the status bar. Touch target is at least 44px for accessibility.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MIN_TOUCH_TARGET = 44;

interface HeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBackPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <View style={styles.logoCenter}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.menuPlaceholder} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -4,
  },
  backPlaceholder: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  logoCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    height: 40,
    width: 120,
  },
  menuPlaceholder: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
});

export default Header;
