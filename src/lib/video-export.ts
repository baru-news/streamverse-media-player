/**
 * Video Export/Import Utilities
 * Functions for exporting and importing video metadata
 */

export const exportVideosData = (videos: any[]) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    totalVideos: videos.length,
    videos: videos.map(video => ({
      file_code: video.file_code,
      title: video.title,
      description: video.description,
      duration: video.duration,
      views: video.views,
      status: video.status,
      title_edited: video.title_edited,
      description_edited: video.description_edited,
      slug: video.slug,
      upload_date: video.upload_date
    }))
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `video-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importVideosData = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onSuccess: () => void
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.videos || !Array.isArray(data.videos)) {
      throw new Error('Invalid file format');
    }

    // Here you would implement the actual import logic
    // This would involve updating the database with the imported data
    console.log('Import data:', data);
    
    // Reset file input
    event.target.value = '';
    
    // Call success callback
    onSuccess();
    
  } catch (error) {
    console.error('Failed to import videos:', error);
    // You might want to show an error toast here
  }
};