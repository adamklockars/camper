import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@camper/ui";
import { sampleCampsites } from "../../components/mock-data";

export default function BookingConfirmScreen() {
  const { campsiteId } = useLocalSearchParams<{ campsiteId: string }>();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const campsite = useMemo(
    () => sampleCampsites.find((c) => c.id === campsiteId),
    [campsiteId],
  );

  // Use the first two available dates as check-in / check-out defaults
  const checkIn = campsite?.availableDates[0] ?? "TBD";
  const checkOut =
    campsite?.availableDates[campsite.availableDates.length > 1 ? 1 : 0] ?? "TBD";
  const nights =
    campsite?.availableDates.length && campsite.availableDates.length > 1
      ? campsite.availableDates.length - 1
      : 1;
  const totalCost = campsite ? campsite.pricePerNight * nights : 0;

  const handleConfirm = useCallback(() => {
    setIsSubmitting(true);
    console.log("[Camper] Confirming booking for campsite:", campsiteId);

    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Booking Confirmed!",
        `Your reservation at ${campsite?.campgroundName ?? "the campground"} has been confirmed.`,
        [
          {
            text: "View Bookings",
            onPress: () => router.replace("/(tabs)/bookings" as any),
          },
        ],
      );
    }, 1500);
  }, [campsiteId, campsite, router]);

  if (!campsite) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Campsite not found</Text>
        <Pressable style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Booking Summary */}
        <Text style={styles.heading}>Booking Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Campsite</Text>
            <Text style={styles.summaryValue}>{campsite.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Campground</Text>
            <Text style={styles.summaryValue}>{campsite.campgroundName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-in</Text>
            <Text style={styles.summaryValue}>{checkIn}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Check-out</Text>
            <Text style={styles.summaryValue}>{checkOut}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nights</Text>
            <Text style={styles.summaryValue}>{nights}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={styles.summaryValue}>
              ${campsite.pricePerNight}/night {campsite.currency}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${totalCost.toFixed(2)} {campsite.currency}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.heading}>Payment Method</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={styles.cardIconPlaceholder}>
              <Text style={styles.cardIconText}>VISA</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>**** **** **** 4242</Text>
              <Text style={styles.cardExpiry}>Expires 12/27</Text>
            </View>
          </View>
          <Pressable onPress={() => console.log("[Camper] Change payment method")}>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>

        {/* Confirm Button */}
        <Pressable
          style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isSubmitting}
        >
          <Text style={styles.confirmButtonText}>
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </Text>
        </Pressable>

        {/* Terms */}
        <Text style={styles.termsText}>
          By confirming this booking, you agree to the campground's cancellation policy and
          Camper's Terms of Service. Reservations are subject to availability confirmation from
          the booking platform. You will receive an email confirmation once the reservation is
          finalized.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing["2xl"],
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.stone[900],
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.stone[500],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.stone[900],
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "60%",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.stone[900],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary[700],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.stone[100],
  },
  paymentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  cardIconPlaceholder: {
    width: 48,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.info,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
  },
  cardInfo: {},
  cardNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.stone[900],
  },
  cardExpiry: {
    fontSize: 12,
    color: theme.colors.stone[400],
    marginTop: 2,
  },
  changeLink: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary[600],
  },
  confirmButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.stone[300],
  },
  confirmButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.stone[400],
    textAlign: "center",
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
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
  goBackButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
  },
  goBackText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
