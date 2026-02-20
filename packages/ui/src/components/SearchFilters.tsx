import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from "react-native";
import type { SiteType } from "@camper/shared-types";
import { theme } from "../theme";

interface SearchFiltersProps {
  location: string;
  onLocationChange: (text: string) => void;
  startDate: string;
  onStartDateChange: (text: string) => void;
  endDate: string;
  onEndDateChange: (text: string) => void;
  selectedSiteTypes: SiteType[];
  onSiteTypeToggle: (type: SiteType) => void;
  groupSize: string;
  onGroupSizeChange: (text: string) => void;
  onSearch: () => void;
}

const siteTypes: { value: SiteType; label: string }[] = [
  { value: "tent", label: "Tent" },
  { value: "rv", label: "RV/Trailer" },
  { value: "cabin", label: "Cabin" },
  { value: "yurt", label: "Yurt" },
  { value: "glamping", label: "Glamping" },
  { value: "backcountry", label: "Backcountry" },
  { value: "group", label: "Group" },
];

export function SearchFilters({
  location,
  onLocationChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  selectedSiteTypes,
  onSiteTypeToggle,
  groupSize,
  onGroupSizeChange,
  onSearch,
}: SearchFiltersProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={onLocationChange}
        placeholder="Where do you want to camp?"
        placeholderTextColor={theme.colors.stone[400]}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={startDate}
          onChangeText={onStartDateChange}
          placeholder="Check-in (YYYY-MM-DD)"
          placeholderTextColor={theme.colors.stone[400]}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={endDate}
          onChangeText={onEndDateChange}
          placeholder="Check-out (YYYY-MM-DD)"
          placeholderTextColor={theme.colors.stone[400]}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        {siteTypes.map((type) => {
          const selected = selectedSiteTypes.includes(type.value);
          return (
            <Pressable
              key={type.value}
              style={[styles.typeChip, selected && styles.typeChipSelected]}
              onPress={() => onSiteTypeToggle(type.value)}
            >
              <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <TextInput
        style={styles.input}
        value={groupSize}
        onChangeText={onGroupSizeChange}
        placeholder="Group size"
        placeholderTextColor={theme.colors.stone[400]}
        keyboardType="numeric"
      />

      <Pressable style={styles.searchButton} onPress={onSearch}>
        <Text style={styles.searchButtonText}>Search Campsites</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.stone[50],
    paddingHorizontal: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.stone[900],
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  typeScroll: {
    marginVertical: theme.spacing.xs,
  },
  typeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.stone[100],
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.stone[200],
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  typeChipText: {
    fontSize: 14,
    color: theme.colors.stone[600],
    fontWeight: "500",
  },
  typeChipTextSelected: {
    color: "#ffffff",
  },
  searchButton: {
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xs,
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
