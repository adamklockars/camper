import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { Booking } from "@camper/shared-types";
import { theme } from "../theme";

interface BookingCardProps {
  booking: Booking;
  onPress?: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: theme.colors.accent[50], text: theme.colors.accent[700] },
  confirmed: { bg: theme.colors.primary[50], text: theme.colors.primary[700] },
  cancelled: { bg: theme.colors.stone[100], text: theme.colors.stone[500] },
  failed: { bg: "#fef2f2", text: theme.colors.error },
};

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const statusColor = statusColors[booking.status] ?? statusColors.pending;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.price}>
          ${booking.totalCost.toFixed(2)} {booking.currency}
        </Text>
      </View>

      <Text style={styles.name}>{booking.campsiteName}</Text>
      <Text style={styles.campground}>{booking.campgroundName}</Text>
      <Text style={styles.dates}>
        {booking.startDate} — {booking.endDate}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
    marginVertical: theme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  campground: {
    fontSize: 14,
    color: theme.colors.stone[600],
    marginTop: 2,
  },
  dates: {
    fontSize: 14,
    color: theme.colors.stone[400],
    marginTop: 4,
  },
});
