export const fallbackAvatar = '/avatar.svg';

export const resolveAssetUrl = (url) => {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value;

  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (value.startsWith('/uploads') && /^https?:\/\//i.test(apiUrl)) {
    const apiOrigin = apiUrl.replace(/\/api\/?$/i, '');
    return new URL(value, apiOrigin).toString();
  }

  return value;
};

export const isPdfAsset = (url) => {
  const pathname = String(url || '').split('?')[0].toLowerCase();
  return pathname.endsWith('.pdf') || pathname.includes('/pdf/');
};

export const getInlineDocumentPreviewUrl = (url) => {
  const assetUrl = resolveAssetUrl(url);
  if (!assetUrl || !isPdfAsset(assetUrl) || !/res\.cloudinary\.com/i.test(assetUrl)) return assetUrl;

  const [pathPart, queryPart] = assetUrl.split('?');
  const transformedPath = pathPart
    .replace('/upload/', '/upload/f_jpg,pg_1,q_auto,w_1400/')
    .replace(/\.pdf$/i, '.jpg');

  return `${transformedPath}${queryPart ? `?${queryPart}` : ''}`;
};

export const withImageFallback = (fallbackSrc = fallbackAvatar) => (event) => {
  if (event.currentTarget.src.endsWith(fallbackSrc)) return;
  event.currentTarget.src = fallbackSrc;
};
