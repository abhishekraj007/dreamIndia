export type ImageGps = {
  lat: number;
  lng: number;
};

export async function readGpsFromImage(file: File): Promise<ImageGps | null> {
  try {
    const exifr = await import("exifr");
    const gps = await exifr.gps(file);
    const latitude = Number(gps?.latitude);
    const longitude = Number(gps?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { lat: latitude, lng: longitude };
  } catch {
    return null;
  }
}
