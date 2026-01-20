import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import RentalRequestForm from "@/components/RentalRequestForm";

export default function HomeScreen() {
  const [showRentalForm, setShowRentalForm] = useState(false);

  const handleStartRental = () => {
    setShowRentalForm(true);
  };

  const handleBackToHome = () => {
    setShowRentalForm(false);
  };

  if (showRentalForm) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToHome}
          >
            <Ionicons name="arrow-back" size={20} color="#1f2937" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
        <RentalRequestForm />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <HeroSection onStartRental={handleStartRental} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
});

