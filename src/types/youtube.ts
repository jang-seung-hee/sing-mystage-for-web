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

// 즐겨찾기 관련 타입
export interface FavoriteItem {
  id: string;
  uid: string;
  video: YouTubeSearchResultItem;
  folderId?: string; // 폴더 ID (없으면 기본 폴더)
  createdAt: number;
}

export interface FavoriteFolder {
  id: string;
  name: string;
  uid: string;
  createdAt: number;
  updatedAt: number;
}
