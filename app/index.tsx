/**
 * HOME SCREEN (index.tsx)
 * The first screen users see. Shows the header, hero carousel + text, and bottom menu.
 * "Start Rental" in the menu pushes the user to the /rental screen (multi-step form).
 */

import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BottomMenuBar from "@/components/BottomMenuBar";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header />
      <HeroSection />
      {/* onStartRental navigates to the rental form when user taps Rent / Start Rental */}
      <BottomMenuBar onStartRental={() => router.push("/rental")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
});

