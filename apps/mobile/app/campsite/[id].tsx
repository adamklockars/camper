import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@camper/ui";
import { sampleCampsites } from "../../components/mock-data";

const siteTypeLabels: Record<string, string> = {
  tent: "Tent",
  rv: "RV/Trailer",
  cabin: "Cabin",
  yurt: "Yurt",
  glamping: "Glamping",
  backcountry: "Backcountry",
  group: "Group Site",
};

export default function CampsiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const campsite = useMemo(
    () => sampleCampsites.find((c) => c.id === id),
    [id],
  );

  const handleBookNow = useCallback(() => {
    if (!campsite) return;
    router.push({
      pathname: "/booking/confirm" as any,
      params: { campsiteId: campsite.id },
    });
  }, [campsite, router]);

  const handleWatchForOpenings = useCallback(() => {
    console.log("[Camper] Watch for openings:", id);
  }, [id]);

  if (!campsite) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Campsite not found</Text>
        <Text style={styles.emptyDescription}>
          This campsite could not be located. It may have been removed or the link is invalid.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Image */}
      {campsite.imageUrls[0] ? (
        <Image source={{ uri: campsite.imageUrls[0] }} style={styles.heroImage} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderText}>No photo available</Text>
        </View>
      )}

      <View style={styles.content}>
        {/* Name and Location */}
        <Text style={styles.name}>{campsite.name}</Text>
        <Text style={styles.campground}>{campsite.campgroundName}</Text>
        <Text style={styles.region}>
          {campsite.region}, {campsite.country}
        </Text>

        {/* Availability */}
        <View style={styles.availabilityRow}>
          <View
            style={[
              styles.availabilityDot,
              campsite.available ? styles.dotAvailable : styles.dotUnavailable,
            ]}
          />
          <Text style={styles.availabilityText}>
            {campsite.available
              ? `Available -- ${campsite.availableDates.length} date${campsite.availableDates.length !== 1 ? "s" : ""} open`
              : "Currently sold out"}
          </Text>
        </View>

        {/* Price and Type */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Price per Night</Text>
            <Text style={styles.infoValue}>
              ${campsite.pricePerNight} {campsite.currency}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Site Type</Text>
            <Text style={styles.infoValue}>
              {siteTypeLabels[campsite.siteType] ?? campsite.siteType}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Max Guests</Text>
            <Text style={styles.infoValue}>{campsite.maxOccupancy}</Text>
          </View>
        </View>

        {/* Description */}
        {campsite.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About this site</Text>
            <Text style={styles.description}>{campsite.description}</Text>
          </View>
        )}

        {/* Amenities */}
        {campsite.amenities.length > 0 && (
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {campsite.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available Dates */}
        {campsite.available && campsite.availableDates.length > 0 && (
          <View style={styles.datesSection}>
            <Text style={styles.sectionTitle}>Available Dates</Text>
            <View style={styles.datesGrid}>
              {campsite.availableDates.map((date) => (
                <View key={date} style={styles.dateChip}>
                  <Text style={styles.dateText}>{date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>Location</Text>
          <View style={styles.mapBox}>
            <Text style={styles.mapCoords}>
              {campsite.latitude.toFixed(4)}, {campsite.longitude.toFixed(4)}
            </Text>
            <Text style={styles.mapNote}>Map view coming soon</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {campsite.available ? (
            <Pressable style={styles.primaryButton} onPress={handleBookNow}>
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.watchButton} onPress={handleWatchForOpenings}>
              <Text style={styles.watchButtonText}>Watch for Openings</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroImage: {
    width: "100%",
    height: 260,
  },
  heroPlaceholder: {
    width: "100%",
    height: 260,
    backgroundColor: theme.colors.stone[200],
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderText: {
    fontSize: 15,
    color: theme.colors.stone[500],
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  campground: {
    fontSize: 16,
    color: theme.colors.stone[600],
    marginTop: 4,
  },
  region: {
    fontSize: 14,
    color: theme.colors.stone[400],
    marginTop: 2,
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.md,
    gap: 8,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotAvailable: {
    backgroundColor: theme.colors.success,
  },
  dotUnavailable: {
    backgroundColor: theme.colors.error,
  },
  availabilityText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.stone[700],
  },
  infoRow: {
    flexDirection: "row",
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoItem: {
    flex: 1,
    backgroundColor: theme.colors.stone[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.stone[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.stone[900],
    marginTop: 4,
  },
  descriptionSection: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.stone[900],
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.stone[600],
  },
  amenitiesSection: {
    marginTop: theme.spacing.lg,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  amenityText: {
    fontSize: 13,
    color: theme.colors.primary[700],
    fontWeight: "500",
  },
  datesSection: {
    marginTop: theme.spacing.lg,
  },
  datesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  dateChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.stone[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.stone[700],
    fontWeight: "500",
  },
  mapPlaceholder: {
    marginTop: theme.spacing.lg,
  },
  mapBox: {
    height: 160,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.stone[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  mapCoords: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.stone[600],
  },
  mapNote: {
    fontSize: 12,
    color: theme.colors.stone[400],
    marginTop: 4,
  },
  mapPlaceholderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.stone[900],
    marginBottom: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.sm,
  },
  primaryButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  watchButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.accent[300],
  },
  watchButtonText: {
    color: theme.colors.accent[700],
    fontSize: 17,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  emptyDescription: {
    fontSize: 15,
    color: theme.colors.stone[500],
    textAlign: "center",
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
