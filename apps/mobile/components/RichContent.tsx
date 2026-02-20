import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RichContent as RichContentType, NormalizedCampsite } from "@camper/shared-types";
import { CampsiteCard, AlertCard, BookingCard, QuickActions, theme } from "@camper/ui";

interface RichContentProps {
  content: RichContentType;
  onCampsitePress?: (id: string) => void;
  onBookPress?: (id: string) => void;
  onWatchPress?: (id: string) => void;
  onQuickAction?: (action: string) => void;
}

export function RichContent({
  content,
  onCampsitePress,
  onBookPress,
  onWatchPress,
  onQuickAction,
}: RichContentProps) {
  switch (content.type) {
    case "campsite_card": {
      const campsite = content.data as unknown as NormalizedCampsite;
      return (
        <View style={styles.container}>
          <CampsiteCard
            campsite={campsite}
            compact
            onPress={() => onCampsitePress?.(campsite.id)}
            onBookPress={() => onBookPress?.(campsite.id)}
            onWatchPress={() => onWatchPress?.(campsite.id)}
          />
        </View>
      );
    }

    case "campsite_list": {
      const campsites = (content.data as { campsites?: unknown[] }).campsites as NormalizedCampsite[] | undefined;
      if (!campsites || campsites.length === 0) {
        return (
          <View style={styles.container}>
            <Text style={styles.emptyText}>No campsites found.</Text>
          </View>
        );
      }
      return (
        <View style={styles.container}>
          {campsites.map((campsite) => (
            <CampsiteCard
              key={campsite.id}
              campsite={campsite}
              compact
              onPress={() => onCampsitePress?.(campsite.id)}
              onBookPress={() => onBookPress?.(campsite.id)}
              onWatchPress={() => onWatchPress?.(campsite.id)}
            />
          ))}
        </View>
      );
    }

    case "booking_confirmation": {
      const data = content.data as {
        campsiteName?: string;
        campgroundName?: string;
        startDate?: string;
        endDate?: string;
        totalCost?: number;
        currency?: string;
        status?: string;
      };
      return (
        <View style={[styles.container, styles.confirmationCard]}>
          <Text style={styles.confirmationTitle}>Booking Confirmed</Text>
          <Text style={styles.confirmationSite}>
            {data.campsiteName ?? "Campsite"}
          </Text>
          <Text style={styles.confirmationCampground}>
            {data.campgroundName ?? ""}
          </Text>
          <Text style={styles.confirmationDates}>
            {data.startDate ?? ""} -- {data.endDate ?? ""}
          </Text>
          <Text style={styles.confirmationCost}>
            ${data.totalCost?.toFixed(2) ?? "0.00"} {data.currency ?? "USD"}
          </Text>
        </View>
      );
    }

    case "alert_status": {
      const alertData = content.data as {
        campgroundName?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
      };
      return (
        <View style={[styles.container, styles.alertStatusCard]}>
          <View style={styles.alertStatusHeader}>
            <View
              style={[
                styles.alertDot,
                {
                  backgroundColor:
                    alertData.status === "active" ? theme.colors.success : theme.colors.stone[400],
                },
              ]}
            />
            <Text style={styles.alertStatusText}>
              {alertData.status === "active" ? "Scanning" : alertData.status ?? "Unknown"}
            </Text>
          </View>
          <Text style={styles.alertCampground}>
            {alertData.campgroundName ?? "Campground"}
          </Text>
          <Text style={styles.alertDates}>
            {alertData.startDate ?? ""} -- {alertData.endDate ?? ""}
          </Text>
        </View>
      );
    }

    case "quick_actions": {
      const actions = (content.data as { actions?: { label: string }[] }).actions ?? [];
      return (
        <QuickActions
          actions={actions.map((a) => ({
            label: a.label,
            onPress: () => onQuickAction?.(a.label),
          }))}
        />
      );
    }

    case "error": {
      const errorData = content.data as { message?: string };
      return (
        <View style={[styles.container, styles.errorCard]}>
          <Text style={styles.errorText}>
            {errorData.message ?? "Something went wrong."}
          </Text>
        </View>
      );
    }

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.stone[500],
    fontStyle: "italic",
  },
  confirmationCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  confirmationSite: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.stone[900],
  },
  confirmationCampground: {
    fontSize: 13,
    color: theme.colors.stone[600],
    marginTop: 2,
  },
  confirmationDates: {
    fontSize: 13,
    color: theme.colors.stone[500],
    marginTop: theme.spacing.xs,
  },
  confirmationCost: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary[700],
    marginTop: theme.spacing.sm,
  },
  alertStatusCard: {
    backgroundColor: theme.colors.stone[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  alertStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.xs,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertStatusText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.stone[500],
  },
  alertCampground: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.stone[900],
  },
  alertDates: {
    fontSize: 13,
    color: theme.colors.stone[500],
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
});
