// Utility functions for image loading with retry and error handling

export interface ImageLoadResult {
  success: boolean;
  error?: string;
  finalUrl?: string;
}

export const loadImageWithRetry = (
  url: string, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ImageLoadResult> => {
  return new Promise((resolve) => {
    let attempts = 0;

    const attemptLoad = () => {
      attempts++;
      const img = new Image();
      
      // Add crossOrigin for CORS handling
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        resolve({ success: true, finalUrl: url });
      };

      img.onerror = (error) => {
        console.warn(`Image load attempt ${attempts}/${maxRetries + 1} failed:`, url, error);
        
        if (attempts <= maxRetries) {
          // Exponential backoff
          const delay = baseDelay * Math.pow(2, attempts - 1);
          setTimeout(attemptLoad, delay);
        } else {
          resolve({ 
            success: false, 
            error: `Failed to load after ${attempts} attempts` 
          });
        }
      };

      img.src = url;
    };

    attemptLoad();
  });
};

export const detectAdBlocker = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a canary image that ad-blockers typically block
    const canaryImg = new Image();
    const canaryUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    // Test with a typical ad-like URL pattern that gets blocked
    const testUrl = '/ads/test-ad-banner.png';
    
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(true); // Assume blocked if timeout
      }
    }, 3000);

    canaryImg.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(false); // Not blocked
      }
    };

    canaryImg.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve(true); // Likely blocked
      }
    };

    // Try to load a test image that would be blocked
    canaryImg.src = testUrl;
  });
};

export const preloadImage = async (url: string): Promise<boolean> => {
  try {
    const result = await loadImageWithRetry(url, 2, 500);
    return result.success;
  } catch {
    return false;
  }
};

export const createFallbackImage = (
  width: number = 300, 
  height: number = 70, 
  text: string = 'Content Not Available'
) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toDataURL();
};