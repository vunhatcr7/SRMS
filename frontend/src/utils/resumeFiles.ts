import api from '../api/axios';

export const openResumeFile = async (
  endpoint: string,
  fileName: string,
  download = false,
): Promise<void> => {
  const previewWindow = download ? null : window.open('', '_blank');

  try {
    const response = await api.get<Blob>(endpoint, { responseType: 'blob' });
    const headerContentType = response.headers['content-type'];
    const contentType = typeof headerContentType === 'string'
      ? headerContentType
      : 'application/octet-stream';
    const objectUrl = URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const safeFilename = fileName.replace(/[\\/\r\n]/g, '_') || 'resume';

    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.location.href = objectUrl;
    } else {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error: unknown) {
    previewWindow?.close();
    throw error;
  }
};
