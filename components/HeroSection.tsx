import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import HeroImageCarousel from "./HeroImageCarousel";
import { EQUIPTER_BASE_URL } from "@/lib/useEnv";

interface HeroSectionProps {  
  onStartRental: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartRental }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <View style={styles.contentSide}>
          <View style={styles.headingContainer}>
            <Text style={styles.heading}>
              INNOVATIVE EQUIPMENT THAT WILL{" "}
              <Text style={styles.headingHighlight}>BOOST YOUR EFFICIENCY</Text>
            </Text>
            <Text style={styles.description}>
              Looking to rent an Equipter? Answer a few quick questions, and
              we'll connect you with the nearest rental location. Get the
              equipment that revolutionizes debris management.
            </Text>
          </View>

          <View style={styles.carouselMobile}>
            <HeroImageCarousel />
          </View>

          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>
                Cut debris clean-up time by up to 80%
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>
                Boost job site efficiency by 25% or more
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <MaterialIcons name="check-circle" size={20} color="#FF6B35" />
              <Text style={styles.benefitText}>
                Complete two to six more jobs a month
              </Text>
            </View>
          </View>

          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onStartRental}
            >
              <Text style={styles.primaryButtonText}>Start Rental Request</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Linking.openURL(EQUIPTER_BASE_URL)}
            >
              <Text style={styles.secondaryButtonText}>Learn More About Equipter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    paddingVertical: 24,
  },
  inner: {
    paddingHorizontal: 16,
  },
  contentSide: {
    gap: 24,
  },
  headingContainer: {
    gap: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    color: "#1f2937",
  },
  headingHighlight: {
    color: "#FF6B35",
    fontWeight: "800",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  carouselMobile: {
    marginVertical: 16,
  },
  benefits: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  ctaContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default HeroSection;

