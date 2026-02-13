/**
 * HERO IMAGE CAROUSEL
 * Horizontal carousel of equipment cards. Data comes from AppContext (models from API).
 * - Autoplay advances every 4.5s unless the user is manually scrolling.
 * - Dots at the bottom show current slide and allow jumping to a slide.
 * - Snap is by card width; loading and error states show a single card placeholder.
 */

import { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useAppContext } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 20;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_RADIUS = 24;
const IMAGE_HEIGHT = 200;
const AUTOPLAY_INTERVAL_MS = 4500;

interface Slide {
  id: string;
  image: string;
  badge: string;
  title: string;
  text: string;
}

const HeroImageCarousel = () => {
  const { isModelsLoading, modelError, models, fetchModels } = useAppContext();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isScrollingRef = useRef(false);

  // Load models from API when component mounts if we don't have any yet
  useEffect(() => {
    if (models?.length === 0) {
      fetchModels();
    }
  }, []);

  // Build slides from API models (image, badge, title, blurb)
  useEffect(() => {
    if (models?.length > 0) {
      setSlides(
        models.map((m) => ({
          id: m?.sfid,
          image: m?.image_url__c,
          badge: m?.code__c,
          title: m?.name__c,
          text: m?.blurb__c,
        }))
      );
    }
  }, [models]);

  useEffect(() => {
    if (slides.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      if (isScrollingRef.current) return;
      setIndex((prev) => {
        const next = prev + 1 >= slides.length ? 0 : prev + 1;
        scrollRef.current?.scrollTo({
          x: next * (CARD_WIDTH + CARD_MARGIN),
          animated: true,
        });
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [slides.length]);

  const onScrollBeginDrag = () => {
    isScrollingRef.current = true;
  };

  const onScrollEndDrag = () => {
    setTimeout(() => { isScrollingRef.current = false; }, 400);
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN));
    if (newIndex >= 0 && newIndex < slides.length) setIndex(newIndex);
  };

  const goTo = (i: number) => {
    isScrollingRef.current = true;
    scrollRef.current?.scrollTo({
      x: i * (CARD_WIDTH + CARD_MARGIN),
      animated: true,
    });
    setIndex(i);
    setTimeout(() => { isScrollingRef.current = false; }, 400);
  };

  if (isModelsLoading)
    return (
      <View style={[styles.loading, { width: SCREEN_WIDTH }]}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  if (modelError)
    return (
      <View style={[styles.loading, { width: SCREEN_WIDTH }]}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Error: {modelError}</Text>
        </View>
      </View>
    );
  if (slides.length === 0) return null;

  return (
    <View style={[styles.container, { width: SCREEN_WIDTH }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        snapToAlignment="start"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: CARD_MARGIN },
        ]}
      >
        {slides.map((s) => (
          <View key={s.id} style={[styles.cardOuter, { width: CARD_WIDTH }]}>
            <View style={[styles.card, { width: CARD_WIDTH }]}>
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: s.image }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{s.badge}</Text>
                </View>
              </View>
              <View style={styles.contentWrap}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {s.title}
                </Text>
                <Text style={styles.cardContent} numberOfLines={3}>
                  {s.text}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    marginVertical: 12,
  },
  scrollContent: {
    gap: CARD_MARGIN,
    paddingVertical: 6,
  },
  cardOuter: {
    borderRadius: CARD_RADIUS + 2,
    padding: 2,
    backgroundColor: "rgba(255, 107, 53, 0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 12 },
    }),
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
    backgroundColor: "#1e293b",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  contentWrap: {
    padding: 20,
    paddingTop: 18,
    backgroundColor: "#0f172a",
  },
  cardName: {
    fontWeight: "800",
    fontSize: 18,
    color: "#f8fafc",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 21,
    color: "#94a3b8",
    letterSpacing: 0.3,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FF6B35",
    width: 28,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  dotInactive: {
    backgroundColor: "#475569",
  },
  loading: {
    paddingHorizontal: CARD_MARGIN,
    marginVertical: 8,
  },
  loadingCard: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
  },
});

export default HeroImageCarousel;
