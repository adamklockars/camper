import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import type { NormalizedCampsite } from "@camper/shared-types";
import { theme } from "../theme";

interface CampsiteCardProps {
  campsite: NormalizedCampsite;
  onPress?: () => void;
  onBookPress?: () => void;
  onWatchPress?: () => void;
  compact?: boolean;
}

const siteTypeLabels: Record<string, string> = {
  tent: "Tent",
  rv: "RV/Trailer",
  cabin: "Cabin",
  yurt: "Yurt",
  glamping: "Glamping",
  backcountry: "Backcountry",
  group: "Group Site",
};

export function CampsiteCard({
  campsite,
  onPress,
  onBookPress,
  onWatchPress,
  compact = false,
}: CampsiteCardProps) {
  return (
    <Pressable style={[styles.card, compact && styles.cardCompact]} onPress={onPress}>
      {campsite.imageUrls[0] && (
        <Image
          source={{ uri: campsite.imageUrls[0] }}
          style={[styles.image, compact && styles.imageCompact]}
        />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{campsite.name}</Text>
        <Text style={styles.campground} numberOfLines={1}>{campsite.campgroundName}</Text>
        <Text style={styles.region}>{campsite.region}, {campsite.country}</Text>

        <View style={styles.details}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{siteTypeLabels[campsite.siteType] ?? campsite.siteType}</Text>
          </View>
          <Text style={styles.price}>
            ${campsite.pricePerNight}/{campsite.currency === "CAD" ? "CAD" : "night"}
          </Text>
        </View>

        <View style={styles.availability}>
          <View style={[styles.dot, campsite.available ? styles.dotAvailable : styles.dotUnavailable]} />
          <Text style={styles.availabilityText}>
            {campsite.available ? "Available" : "Sold out"}
          </Text>
        </View>

        {!compact && (
          <View style={styles.actions}>
            {campsite.available && onBookPress && (
              <Pressable style={styles.bookButton} onPress={onBookPress}>
                <Text style={styles.bookButtonText}>Book</Text>
              </Pressable>
            )}
            {!campsite.available && onWatchPress && (
              <Pressable style={styles.watchButton} onPress={onWatchPress}>
                <Text style={styles.watchButtonText}>Watch for openings</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
    marginVertical: theme.spacing.xs,
  },
  cardCompact: {
    flexDirection: "row",
    height: 100,
  },
  image: {
    width: "100%",
    height: 160,
  },
  imageCompact: {
    width: 100,
    height: "100%",
  },
  content: {
    padding: theme.spacing.md,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  campground: {
    fontSize: 14,
    color: theme.colors.stone[600],
    marginTop: 2,
  },
  region: {
    fontSize: 13,
    color: theme.colors.stone[400],
    marginTop: 2,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.primary[700],
    fontWeight: "600",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  availability: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAvailable: {
    backgroundColor: theme.colors.success,
  },
  dotUnavailable: {
    backgroundColor: theme.colors.error,
  },
  availabilityText: {
    fontSize: 13,
    color: theme.colors.stone[500],
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  bookButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  watchButton: {
    flex: 1,
    backgroundColor: theme.colors.accent[50],
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.accent[300],
  },
  watchButtonText: {
    color: theme.colors.accent[700],
    fontWeight: "700",
    fontSize: 15,
  },
});
