// YouTube API response types

export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeThumbnails {
  default: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  liveBroadcastContent?: string;
  publishTime?: string;
}

export interface YouTubeVideoId {
  kind: string;
  videoId: string;
}

export interface YouTubeSearchResultItem {
  kind: string;
  etag: string;
  id: YouTubeVideoId | string;
  snippet: YouTubeSnippet;
}

export type YouTubeSearchResults = YouTubeSearchResultItem[];
