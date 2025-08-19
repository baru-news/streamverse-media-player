import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other';
  video?: {
    title: string;
    description: string;
    thumbnail: string;
    duration?: number;
    uploadDate?: string;
    embedUrl?: string;
  };
}

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = 'website',
  video 
}: SEOProps) => {
  const location = useLocation();
  
  const defaultTitle = "DINO18 - Platform Streaming Video Terdepan";
  const defaultDescription = "Nikmati ribuan video berkualitas tinggi di DINO18. Film, dokumenter, komedi, dan konten edukasi dalam satu platform streaming modern dengan Doodstream.";
  const defaultImage = "https://lovable.dev/opengraph-image-p98pqg.png";
  const defaultKeywords = "streaming video, doodstream, video online, film streaming, hiburan online, DINO18, video berkualitas tinggi";
  
  const seoTitle = title ? `${title} | DINO18` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image || defaultImage;
  const seoUrl = url || `${window.location.origin}${location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('keywords', seoKeywords);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('author', 'DINO18');
    updateMetaTag('language', 'id');
    updateMetaTag('revisit-after', '7 days');

    // Open Graph tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'DINO18', true);
    updateMetaTag('og:locale', 'id_ID', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@dino18streaming');
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);

    // Video-specific meta tags
    if (video && type === 'video.other') {
      updateMetaTag('og:video:title', video.title, true);
      updateMetaTag('og:video:description', video.description, true);
      updateMetaTag('og:video:thumbnail', video.thumbnail, true);
      
      if (video.duration) {
        updateMetaTag('og:video:duration', video.duration.toString(), true);
      }
      
      if (video.uploadDate) {
        updateMetaTag('og:video:release_date', video.uploadDate, true);
      }

      if (video.embedUrl) {
        updateMetaTag('og:video:url', video.embedUrl, true);
        updateMetaTag('og:video:secure_url', video.embedUrl, true);
        updateMetaTag('og:video:type', 'text/html', true);
      }

      // Twitter Player Card for videos
      updateMetaTag('twitter:card', 'player');
      if (video.embedUrl) {
        updateMetaTag('twitter:player', video.embedUrl);
        updateMetaTag('twitter:player:width', '800');
        updateMetaTag('twitter:player:height', '450');
      }
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', seoUrl);

    // Structured Data for videos
    if (video) {
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": video.title,
        "description": video.description,
        "thumbnailUrl": video.thumbnail,
        "uploadDate": video.uploadDate || new Date().toISOString(),
        "duration": video.duration ? `PT${video.duration}S` : undefined,
        "embedUrl": video.embedUrl,
        "publisher": {
          "@type": "Organization",
          "name": "DINO18",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/favicon.ico`
          }
        },
        "potentialAction": {
          "@type": "WatchAction",
          "target": seoUrl
        }
      };

      // Remove undefined values
      Object.keys(structuredData).forEach(key => {
        if (structuredData[key as keyof typeof structuredData] === undefined) {
          delete structuredData[key as keyof typeof structuredData];
        }
      });

      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify(structuredData);
    } else {
      // Remove video structured data if not a video page
      const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
      if (existingJsonLd && existingJsonLd.textContent?.includes('VideoObject')) {
        existingJsonLd.remove();
      }

      // Add website structured data
      const websiteStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "DINO18",
        "description": defaultDescription,
        "url": window.location.origin,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };

      let websiteJsonLd = document.querySelector('script[data-schema="website"]');
      if (!websiteJsonLd) {
        websiteJsonLd = document.createElement('script');
        websiteJsonLd.setAttribute('type', 'application/ld+json');
        websiteJsonLd.setAttribute('data-schema', 'website');
        document.head.appendChild(websiteJsonLd);
      }
      websiteJsonLd.textContent = JSON.stringify(websiteStructuredData);
    }

  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoUrl, type, video]);

  return null;
};

export default SEO;