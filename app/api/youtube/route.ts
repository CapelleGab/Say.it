import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default?: { url: string };
      high?: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

export async function POST(req: Request) {
  try {
    const { query, timecode } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to fetch videos from YouTube" },
        { status: 500 }
      );
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ videos: [] });
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
      return NextResponse.json(
        { error: "Failed to fetch video details from YouTube" },
        { status: 500 }
      );
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
      embedUrl: `https://www.youtube.com/embed/${item.id}${
        timecode ? `?start=${convertTimeToSeconds(timecode)}` : ""
      }`,
    }));

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}

// Fonction pour convertir un timecode (HH:MM:SS) en secondes pour YouTube
function convertTimeToSeconds(timecode: string): number {
  if (!timecode) return 0;

  const parts = timecode.split(":").map(Number);

  // Format HH:MM:SS
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  // Format MM:SS
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  // Format SS
  if (parts.length === 1) {
    return parts[0];
  }

  return 0;
}
