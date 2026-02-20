import React, { useState, useCallback } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { NormalizedCampsite, SiteType } from "@camper/shared-types";
import { SearchFilters, CampsiteCard, EmptyState, LoadingSpinner, theme } from "@camper/ui";
import { sampleCampsites } from "../../components/mock-data";

export default function SearchScreen() {
  const router = useRouter();

  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSiteTypes, setSelectedSiteTypes] = useState<SiteType[]>([]);
  const [groupSize, setGroupSize] = useState("");
  const [results, setResults] = useState<NormalizedCampsite[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSiteTypeToggle = useCallback((type: SiteType) => {
    setSelectedSiteTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }, []);

  const handleSearch = useCallback(() => {
    console.log("[Camper] Searching:", { location, startDate, endDate, selectedSiteTypes, groupSize });
    setLoading(true);
    setHasSearched(true);

    // Simulate network delay
    setTimeout(() => {
      let filtered = [...sampleCampsites];

      if (location.trim()) {
        const query = location.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.campgroundName.toLowerCase().includes(query) ||
            c.region.toLowerCase().includes(query) ||
            c.name.toLowerCase().includes(query),
        );
      }

      if (selectedSiteTypes.length > 0) {
        filtered = filtered.filter((c) => selectedSiteTypes.includes(c.siteType));
      }

      if (groupSize.trim()) {
        const size = parseInt(groupSize, 10);
        if (!isNaN(size)) {
          filtered = filtered.filter((c) => c.maxOccupancy >= size);
        }
      }

      setResults(filtered);
      setLoading(false);
    }, 800);
  }, [location, startDate, endDate, selectedSiteTypes, groupSize]);

  const handleCampsitePress = useCallback(
    (campsite: NormalizedCampsite) => {
      router.push(`/campsite/${campsite.id}` as any);
    },
    [router],
  );

  const handleBookPress = useCallback(
    (campsite: NormalizedCampsite) => {
      router.push({
        pathname: "/booking/confirm" as any,
        params: { campsiteId: campsite.id },
      });
    },
    [router],
  );

  const renderCampsite = useCallback(
    ({ item }: { item: NormalizedCampsite }) => (
      <CampsiteCard
        campsite={item}
        onPress={() => handleCampsitePress(item)}
        onBookPress={item.available ? () => handleBookPress(item) : undefined}
        onWatchPress={
          !item.available
            ? () => console.log("[Camper] Watch for openings:", item.id)
            : undefined
        }
      />
    ),
    [handleCampsitePress, handleBookPress],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        renderItem={renderCampsite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SearchFilters
            location={location}
            onLocationChange={setLocation}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            selectedSiteTypes={selectedSiteTypes}
            onSiteTypeToggle={handleSiteTypeToggle}
            groupSize={groupSize}
            onGroupSizeChange={setGroupSize}
            onSearch={handleSearch}
          />
        }
        ListEmptyComponent={
          loading ? (
            <LoadingSpinner message="Searching campsites..." />
          ) : hasSearched ? (
            <EmptyState
              title="No campsites found"
              description="Try adjusting your filters or searching a different location."
            />
          ) : (
            <EmptyState
              title="Find your perfect campsite"
              description="Enter a location and dates above to search for available campsites across all platforms."
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
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    flexGrow: 1,
  },
});
