import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import { EQUIPTER_BASE_URL, EQUIPTER_RENT_URL } from "@/lib/useEnv";

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handlePhonePress = () => {
    Linking.openURL("tel:717-661-3591");
  };

  const handleFindLocations = () => {
    Linking.openURL(EQUIPTER_RENT_URL);
  };

  const handleAboutEquipter = () => {
    Linking.openURL(EQUIPTER_BASE_URL);
  };

  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Image 
            source={require("@/assets/images/logo.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
          
          <TouchableOpacity
            onPress={() => setOpen(!open)}
            style={styles.menuButton}
          >
            {open ? (
              <Ionicons name="close" size={24} color="#333" />
            ) : (
              <Ionicons name="menu" size={24} color="#333" />
            )}
          </TouchableOpacity>
        </View>

        {open && (
          <View style={styles.mobileMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handlePhonePress}
            >
              <MaterialIcons name="phone" size={16} color="#fff" />
              <Text style={styles.menuItemText}>717-661-3591</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemOutline]}
              onPress={handleFindLocations}
            >
              <MaterialIcons name="place" size={16} color="#FF6B35" />
              <Text style={styles.menuItemTextOutline}>Find Locations</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItemLink}
              onPress={handleAboutEquipter}
            >
              <Feather name="external-link" size={16} color="#FF6B35" />
              <Text style={styles.menuItemTextLink}>About Equipter</Text>
            </TouchableOpacity>
          </View>
        )}
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
  logo: {
    height: 40,
    width: 120,
  },
  menuButton: {
    padding: 8,
  },
  mobileMenu: {
    marginTop: 12,
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF6B35",
    padding: 12,
    borderRadius: 8,
  },
  menuItemOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FF6B35",
  },
  menuItemLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  menuItemText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  menuItemTextOutline: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 14,
  },
  menuItemTextLink: {
    color: "#FF6B35",
    fontSize: 14,
  },
});

export default Header;

