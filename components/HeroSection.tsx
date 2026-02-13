/**
 * HERO SECTION
 * The main content block on the home screen: heading, description, equipment carousel, and benefit bullets.
 * Wraps everything in a ScrollView so it scrolls if the content is tall (e.g. on small screens).
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import HeroImageCarousel from "./HeroImageCarousel";

const HeroSection: React.FC = () => {
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

          <View style={[styles.carouselMobile, { width: Dimensions.get("window").width, marginLeft: -16, marginRight: -16 }]}>
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
});

export default HeroSection;

