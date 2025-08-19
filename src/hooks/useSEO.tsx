import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHook {
  setPageTitle: (title: string) => void;
  setPageDescription: (description: string) => void;
  setPageKeywords: (keywords: string) => void;
  updateMetaTags: (tags: Record<string, string>) => void;
}

export const useSEO = (): SEOHook => {
  const location = useLocation();

  const setPageTitle = (title: string) => {
    document.title = title.includes('DINO18') ? title : `${title} | DINO18`;
  };

  const setPageDescription = (description: string) => {
    updateMetaTag('description', description);
  };

  const setPageKeywords = (keywords: string) => {
    updateMetaTag('keywords', keywords);
  };

  const updateMetaTag = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  const updateMetaTags = (tags: Record<string, string>) => {
    Object.entries(tags).forEach(([name, content]) => {
      updateMetaTag(name, content);
    });
  };

  // Update canonical URL on route change
  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${location.pathname}`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [location.pathname]);

  return {
    setPageTitle,
    setPageDescription,
    setPageKeywords,
    updateMetaTags
  };
};