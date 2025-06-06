export type YouTubeSearchItem = {
  id: {
    videoId: string;
  };
};

export type YouTubeVideoItem = {
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
};
