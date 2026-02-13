/**
 * BOTTOM MENU BAR
 * The bar at the bottom of the home screen with four actions:
 * Find Location (opens rent URL in browser), Call (opens phone dialer), Rent (starts rental flow), About (opens base URL).
 * Uses safe area insets so the bar sits above the home indicator on notched devices.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EQUIPTER_BASE_URL, EQUIPTER_RENT_URL } from "@/lib/useEnv";

/**
 * Open URL: on Android use Custom Tab in same task (createTask: false) + experimentalLauncherActivity
 * so returning to the app doesn't freeze. iOS uses in-app browser with short delay.
 */
function openUrl(url: string) {
  if (Platform.OS === "android") {
    WebBrowser.openBrowserAsync(url, { createTask: false });
  } else {
    setTimeout(() => WebBrowser.openBrowserAsync(url), 300);
  }
}

interface BottomMenuBarProps {
  onStartRental: () => void;
}

const BottomMenuBar: React.FC<BottomMenuBarProps> = ({ onStartRental }) => {
  const insets = useSafeAreaInsets();

  const handleFindLocation = () => openUrl(EQUIPTER_RENT_URL);
  const handleCall = () => Linking.openURL("tel:717-661-3591");
  const handleAbout = () => openUrl(EQUIPTER_BASE_URL);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.option} onPress={handleFindLocation}>
          <MaterialIcons name="place" size={24} color="#FF6B35" />
          <Text style={styles.optionLabel}>Find Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleCall}>
          <MaterialIcons name="phone" size={24} color="#FF6B35" />
          <Text style={styles.optionLabel}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={onStartRental}>
          <Ionicons name="cart-outline" size={24} color="#FF6B35" />
          <Text style={styles.optionLabel}>Rent</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleAbout}>
          <Feather name="info" size={24} color="#FF6B35" />
          <Text style={styles.optionLabel}>About</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  optionLabel: {
    color: "#1f2937",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default BottomMenuBar;
