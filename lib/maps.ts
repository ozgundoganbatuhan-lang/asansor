export type MapsDestination = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label?: string | null;
};

function normalizeAddress(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function buildGoogleMapsDirections(destination: MapsDestination) {
  const hasCoordinates = typeof destination.latitude === "number" && typeof destination.longitude === "number";
  const target = hasCoordinates
    ? `${destination.latitude},${destination.longitude}`
    : normalizeAddress(destination.address || destination.label);

  if (!target) return "https://www.google.com/maps";

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", target);
  if (destination.label && !hasCoordinates) {
    url.searchParams.set("travelmode", "driving");
  }
  return url.toString();
}

export function buildGoogleMapsPlace(destination: MapsDestination) {
  const hasCoordinates = typeof destination.latitude === "number" && typeof destination.longitude === "number";
  const target = hasCoordinates
    ? `${destination.latitude},${destination.longitude}`
    : normalizeAddress(destination.address || destination.label);

  if (!target) return "https://www.google.com/maps";

  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", target);
  return url.toString();
}
