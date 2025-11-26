import { google } from 'googleapis';
import { config } from './config/env';
import logger from './config/logger';

export function getUncachableYouTubeClient() {
  if (!config.YOUTUBE_API_KEY) {
    logger.warn('YouTube API key not configured');
    throw new Error('YouTube API key not configured');
  }

  return google.youtube({
    version: 'v3',
    auth: config.YOUTUBE_API_KEY,
  });
}

export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch (error) {
    logger.error('Error extracting video ID:', error);
    return null;
  }
}
