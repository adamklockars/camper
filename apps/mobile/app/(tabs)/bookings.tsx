import React, { useState, useMemo, useCallback } from "react";
import { View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { Booking } from "@camper/shared-types";
import { BookingCard, EmptyState, theme } from "@camper/ui";
import { sampleBookings } from "../../components/mock-data";

type Segment = "upcoming" | "past";

export default function BookingsScreen() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<Segment>("upcoming");

  const today = new Date().toISOString().slice(0, 10);

  const upcomingBookings = useMemo(
    () => sampleBookings.filter((b) => b.startDate >= today),
    [today],
  );

  const pastBookings = useMemo(
    () => sampleBookings.filter((b) => b.startDate < today),
    [today],
  );

  const displayedBookings = activeSegment === "upcoming" ? upcomingBookings : pastBookings;

  const handleBookingPress = useCallback(
    (booking: Booking) => {
      console.log("[Camper] Booking tapped:", booking.id);
      router.push(`/campsite/${booking.campsiteId}` as any);
    },
    [router],
  );

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => (
      <BookingCard booking={item} onPress={() => handleBookingPress(item)} />
    ),
    [handleBookingPress],
  );

  return (
    <View style={styles.container}>
      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[
            styles.segmentButton,
            activeSegment === "upcoming" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveSegment("upcoming")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "upcoming" && styles.segmentTextActive,
            ]}
          >
            Upcoming
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentButton,
            activeSegment === "past" && styles.segmentButtonActive,
          ]}
          onPress={() => setActiveSegment("past")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "past" && styles.segmentTextActive,
            ]}
          >
            Past
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={displayedBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          activeSegment === "upcoming" ? (
            <EmptyState
              title="No upcoming bookings"
              description="Your confirmed campsite reservations will appear here."
              actionLabel="Find a campsite"
              onAction={() => router.push("/(tabs)/search" as any)}
            />
          ) : (
            <EmptyState
              title="No past bookings"
              description="Your completed camping trips will appear here."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.stone[100],
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    borderRadius: theme.borderRadius.sm,
  },
  segmentButtonActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.stone[500],
  },
  segmentTextActive: {
    color: theme.colors.primary[700],
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
});
