"use server";

import {
  YouTubeSearchItem,
  YouTubeVideoItem,
} from "../types/youtube/youtubeItem";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

export const searchYouTubeVideos = async (query: string) => {
  try {
    if (!query) {
      throw new Error("Query parameter is required");
    }

    // Appel à l'API YouTube pour rechercher des vidéos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
        query
      )}&key=${YOUTUBE_API_KEY}&type=video`
    );

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error("YouTube API error:", errorData);
      throw new Error("Failed to fetch videos from YouTube");
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return { videos: [] };
    }

    // On récupère les détails des vidéos pour avoir la durée
    const videoIds = searchData.items
      .map((item: YouTubeSearchItem) => item.id.videoId)
      .join(",");
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json();
      console.error("YouTube API error (video details):", errorData);
      throw new Error("Failed to fetch video details from YouTube");
    }

    const detailsData = await detailsResponse.json();

    // Enrichir les résultats avec les détails
    const videos = detailsData.items.map((item: YouTubeVideoItem) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      duration: item.contentDetails.duration,
      viewCount: item.statistics.viewCount,
      publishedAt: item.snippet.publishedAt,
      embedUrl: `https://www.youtube.com/embed/${item.id}`,
    }));

    return { videos };
  } catch (error) {
    console.error("Server action error:", error);
    throw error;
  }
};
