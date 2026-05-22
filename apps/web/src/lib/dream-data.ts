import type { DreamReport, DreamStats, IssueType } from "./dream-types";

export const issueOptions: { value: IssueType; label: string }[] = [
  { value: "roads", label: "Roads" },
  { value: "rivers", label: "Rivers" },
  { value: "popular-place", label: "Popular places" },
  { value: "transit", label: "Transit access" },
  { value: "waste", label: "Waste hotspots" },
  { value: "drainage", label: "Drainage" },
];

export const demoReports: DreamReport[] = [
  {
    id: "demo-road",
    title: "Broken service road renewal",
    issueType: "roads",
    severity: "critical",
    status: "ai-ready",
    locationName: "Silk Board service road, Bengaluru",
    address: "Near Silk Board Junction, Bengaluru, Karnataka",
    lat: 12.9177,
    lng: 77.6238,
    description:
      "Broken asphalt, exposed drainage, weak pedestrian protection, and chaotic utility edges.",
    planningGoal:
      "Complete street with stormwater cover, safe footpath, bus priority, shade trees, and protected crossing.",
    beforeImageUrl: "/assets/road-before.png",
    afterImageUrl: "/assets/road-after.png",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=12.9177,77.6238",
    tags: ["footpath", "drainage", "junction"],
    votes: 248,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: "demo-river",
    title: "Polluted river edge recovery",
    issueType: "rivers",
    severity: "high",
    status: "planning",
    locationName: "Yamuna edge near Okhla, Delhi",
    address: "Okhla Barrage edge, New Delhi",
    lat: 28.5456,
    lng: 77.3065,
    description:
      "Waste leakage, unsafe river access, missing public edge, and weak ecological buffers.",
    planningGoal:
      "Clean river edge with wetlands, safe promenade, waste interception, shaded public access, and cycle route.",
    beforeImageUrl: "/assets/river-before.png",
    afterImageUrl: "/assets/river-after.png",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=28.5456,77.3065",
    tags: ["river", "cleanup", "public-edge"],
    votes: 391,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "demo-place",
    title: "Popular place approach cleanup",
    issueType: "popular-place",
    severity: "medium",
    status: "ai-ready",
    locationName: "Gateway district approach, Mumbai",
    address: "Apollo Bandar area, Mumbai, Maharashtra",
    lat: 18.922,
    lng: 72.8347,
    description:
      "Cluttered parking, weak wayfinding, cracked paving, and poor waste organization.",
    planningGoal:
      "Pedestrian-first plaza with organized vendor bays, clean waste points, shade, clear access, and heritage-sensitive paving.",
    beforeImageUrl: "/assets/place-before.png",
    afterImageUrl: "/assets/place-after.png",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=18.9220,72.8347",
    tags: ["tourism", "plaza", "vendors"],
    votes: 174,
    createdAt: Date.now() - 86400000,
  },
];

export const demoStats: DreamStats = {
  reports: 1284,
  aiReady: 816,
  planning: 143,
  votes: 49102,
  byIssue: {
    roads: 482,
    rivers: 207,
    "popular-place": 244,
    transit: 119,
    waste: 138,
    drainage: 94,
  },
};
