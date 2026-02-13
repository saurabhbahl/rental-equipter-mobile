/**
 * RENTAL SCREEN (rental.tsx)
 * Shows the rental request form (ZIP → equipment → dates → details → contact → success).
 * - Header has a back button that goes back to home (router.back()).
 * - When user taps "Submit Request" on step 5, onSubmittingChange(true) is called and we show
 *   a full-screen "Submitting your request..." overlay so the form stays mounted and keeps state.
 * - When the API call finishes, onSubmittingChange(false) hides the overlay and the success step is visible.
 */

import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Header from "@/components/Header";
import RentalRequestForm from "@/components/RentalRequestForm";
import { Loader } from "@/components/Loader";

export default function RentalScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  return (
    <View style={styles.container}>
      <Header
        showBackButton
        onBackPress={() => router.back()}
      />
      <RentalRequestForm onSubmittingChange={setSubmitting} />
      {/* Full-screen overlay only when submitting step 5; form stays mounted underneath */}
      {submitting && (
        <View style={styles.submittingOverlay} pointerEvents="box-none">
          <View style={styles.submittingPage}>
            <Loader size="large" color="#FF6B35" />
            <Text style={styles.submittingText}>Submitting your request...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  submittingPage: {
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  submittingText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
});
