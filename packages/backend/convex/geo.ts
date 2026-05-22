import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";

const nullableString = v.union(v.string(), v.null());

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: Array<string>;
};

type GoogleGeocodeResult = {
  formatted_address?: string;
  types?: Array<string>;
  address_components?: Array<GoogleAddressComponent>;
};

function componentValue(
  components: Array<GoogleAddressComponent>,
  types: Array<string>,
) {
  return (
    components.find((component) =>
      types.some((type) => component.types.includes(type)),
    )?.long_name ?? null
  );
}

function chooseLocationName(results: Array<GoogleGeocodeResult>) {
  const preferredResult =
    results.find((result) =>
      (result.types ?? []).some((type) =>
        [
          "point_of_interest",
          "premise",
          "establishment",
          "route",
          "sublocality",
          "neighborhood",
        ].includes(type),
      ),
    ) ?? results[0];

  const components = preferredResult?.address_components ?? [];
  return (
    componentValue(components, [
      "point_of_interest",
      "premise",
      "establishment",
    ]) ??
    componentValue(components, ["route"]) ??
    componentValue(components, ["sublocality_level_1", "sublocality"]) ??
    componentValue(components, ["neighborhood"]) ??
    preferredResult?.formatted_address?.split(",")[0]?.trim() ??
    null
  );
}

export const reverseGeocode = action({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  returns: v.object({
    formattedAddress: nullableString,
    locationName: nullableString,
    city: nullableString,
    state: nullableString,
    country: nullableString,
    postalCode: nullableString,
  }),
  handler: async (_ctx, args) => {
    const googleMapsKey = process.env.GOOGLE_MAPS_KEY;
    if (!googleMapsKey) {
      throw new ConvexError(
        "GOOGLE_MAPS_KEY is not configured in Convex environment variables.",
      );
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${args.lat},${args.lng}`);
    url.searchParams.set("key", googleMapsKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const body = await response.text();
      throw new ConvexError(
        `Reverse geocoding failed: ${response.status} ${body}`,
      );
    }

    const json = (await response.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<GoogleGeocodeResult>;
    };

    if (json.status === "ZERO_RESULTS") {
      return {
        formattedAddress: null,
        locationName: null,
        city: null,
        state: null,
        country: null,
        postalCode: null,
      };
    }

    if (json.status && json.status !== "OK") {
      throw new ConvexError(
        `Reverse geocoding failed: ${json.status}${json.error_message ? ` - ${json.error_message}` : ""}`,
      );
    }

    const result = json.results?.[0];
    const components = result?.address_components ?? [];

    return {
      formattedAddress: result?.formatted_address ?? null,
      locationName: chooseLocationName(json.results ?? []),
      city: componentValue(components, [
        "locality",
        "administrative_area_level_3",
      ]),
      state: componentValue(components, ["administrative_area_level_1"]),
      country: componentValue(components, ["country"]),
      postalCode: componentValue(components, ["postal_code"]),
    };
  },
});
