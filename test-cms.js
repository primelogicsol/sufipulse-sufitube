#!/usr/bin/env node

// Quick test to create a CMS release
const releases = [
  {
    title: "Sufi Poetry Recitation - Heart's Whisper",
    slug: "hearts-whisper",
    youtubeId: "LXb3EKWsInQ",
    description: "A beautiful recitation of traditional Sufi poetry exploring themes of divine love and spiritual awakening.",
    releaseDate: "2025-12-15",
    durationSeconds: 420,
    durationFormatted: "7:00",
    viewCount: 3500,
    likeCount: 250,
    status: "published",
    thumbnailUrl: "https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
    enableLyrics: true,
    enableCommentary: true,
    enableSponsors: false,
    enableAdoption: true,
    enableCredits: true,
    vocalist: { name: "Fatima Zahra", nameUrdu: "فاطمہ زہرا" },
    producer: { name: "Ali Raza" }
  },
  {
    title: "Sacred Vocal Performance - The Eternal Path",
    slug: "eternal-path",
    youtubeId: "kZ7K8nT2mP9",
    description: "An enchanting vocal performance blending traditional and contemporary elements in Sufi music.",
    releaseDate: "2025-12-10",
    durationSeconds: 480,
    durationFormatted: "8:00",
    viewCount: 2800,
    likeCount: 200,
    status: "published",
    thumbnailUrl: "https://i.ytimg.com/vi/kZ7K8nT2mP9/maxresdefault.jpg",
    enableLyrics: true,
    enableCommentary: true,
    enableSponsors: false,
    enableAdoption: true,
    enableCredits: true,
    vocalist: { name: "Usman Ali", nameUrdu: "عثمان علی" },
    producer: { name: "Hamza Malik" }
  }
];

console.log("Test data for CMS releases:");
console.log(JSON.stringify(releases, null, 2));
console.log("\nTo create these, POST to http://localhost:3000/api/releases");
