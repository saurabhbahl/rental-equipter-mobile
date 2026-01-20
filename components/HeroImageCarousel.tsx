import { useEffect, useRef, useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, Text } from "react-native";
import { useAppContext } from "@/context/AppContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = () => {
    if (slides.length === 0) return;
    setIndex((i) => (i + 1) % slides.length);
  };

  const prev = () => {
    if (slides.length === 0) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const goTo = (i: number) => setIndex(i);

  // autoplay
  useEffect(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
    
    if (isPaused) return;
    if (!isPaused && slides.length > 0) {
      autoplayRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, 3500);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isPaused, slides.length]);
  
  useEffect(() => {
    if (models?.length === 0) {
      fetchModels();
    }
  }, []);

  useEffect(() => {
    if (models?.length > 0) {
      const newSlides = models?.map((m) => ({
        id: m?.sfid,
        image: m?.image_url__c,
        badge: m?.code__c,
        title: m?.name__c,
        text: m?.blurb__c,
      }));

      setSlides(newSlides);
    }
  }, [models]);

  if (isModelsLoading) return <View style={styles.loading}><Text>Loading...</Text></View>;
  if (modelError) return <View style={styles.loading}><Text>Error: {modelError}</Text></View>;

  if (slides.length === 0) return null;

  return (
    <View
      style={styles.container}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {slides.map((s, i) => (
        <View
          key={s.id}
          style={[
            styles.slide,
            i === index ? styles.slideActive : styles.slideInactive,
          ]}
        >
          <Image
            source={{ uri: s.image }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{s.badge}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </View>
        </View>
      ))}
      
      <View style={styles.dots}>
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
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    height: 400,
    width: '100%',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideActive: {
    opacity: 1,
    zIndex: 10,
  },
  slideInactive: {
    opacity: 0,
    zIndex: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    transform: [{ scale: 1.25 }],
  },
  dotInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  loading: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeroImageCarousel;

