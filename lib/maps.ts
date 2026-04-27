export type MapsDestination = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
};

function normalizeAddress(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

/** Returns null when there is no usable destination (instead of a bare /maps link). */
export function buildGoogleMapsDirections(destination: MapsDestination): string | null {
  const hasCoordinates =
    typeof destination.latitude === "number" &&
    typeof destination.longitude === "number" &&
    isFinite(destination.latitude) &&
    isFinite(destination.longitude);

  const target = hasCoordinates
    ? `${destination.latitude},${destination.longitude}`
    : normalizeAddress(destination.address || destination.label);

  if (!target) return null;

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", target);
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

export function buildGoogleMapsPlace(destination: MapsDestination): string | null {
  const hasCoordinates =
    typeof destination.latitude === "number" &&
    typeof destination.longitude === "number" &&
    isFinite(destination.latitude) &&
    isFinite(destination.longitude);

  const target = hasCoordinates
    ? `${destination.latitude},${destination.longitude}`
    : normalizeAddress(destination.address || destination.label);

  if (!target) return null;

  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", target);
  return url.toString();
}
