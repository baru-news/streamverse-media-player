/**
 * SEO Utility Functions
 * Helper functions for generating SEO-friendly titles, descriptions, and slugs
 */

export const generateSEOTitle = (originalTitle: string): string => {
  // Remove common file extensions and clean up the title
  let title = originalTitle
    .replace(/\.(mp4|avi|mkv|mov|wmv|flv|webm)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word (title case)
  title = title.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );

  // Remove numbers at the beginning if they look like file codes
  title = title.replace(/^[\d\w]{8,}\s*-?\s*/i, '');

  // Ensure title is not too long for SEO (max 60 characters)
  if (title.length > 60) {
    title = title.substring(0, 57) + '...';
  }

  return title || 'Video Content';
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const generateMetaDescription = (content: string): string => {
  if (!content) return 'Tonton video streaming berkualitas tinggi di platform kami. Nikmati konten terbaru dengan kualitas terbaik.';

  // Clean up the content
  let description = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If it's too short, add some context
  if (description.length < 50) {
    description = `${description} - Streaming video berkualitas tinggi dengan pengalaman menonton yang optimal.`;
  }

  // Ensure description is not too long for SEO (max 160 characters)
  if (description.length > 160) {
    description = description.substring(0, 157) + '...';
  }

  return description;
};

export const generateVideoKeywords = (title: string, description?: string): string => {
  const commonKeywords = [
    'video streaming', 'online video', 'HD video', 'streaming platform',
    'video content', 'entertainment', 'media streaming', 'video player'
  ];

  // Extract meaningful words from title and description
  const text = `${title} ${description || ''}`.toLowerCase();
  const words = text.match(/\b[a-z]{3,}\b/g) || [];
  
  // Get unique meaningful words
  const meaningfulWords = [...new Set(words)]
    .filter(word => word.length >= 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'].includes(word))
    .slice(0, 5);

  return [...meaningfulWords, ...commonKeywords.slice(0, 3)].join(', ');
};

export const generateStructuredData = (video: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description || generateMetaDescription(video.title),
    "thumbnailUrl": video.thumbnail_url,
    "uploadDate": video.upload_date,
    "duration": video.duration ? `PT${video.duration}S` : undefined,
    "contentUrl": `https://dood.re/e/${video.file_code}`,
    "embedUrl": `https://dood.re/e/${video.file_code}`,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "http://schema.org/WatchAction" },
      "userInteractionCount": video.views || 0
    }
  };
};