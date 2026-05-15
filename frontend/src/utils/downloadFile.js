export const downloadFile = (blobOrUrl, filename = 'download') => {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (typeof blobOrUrl !== 'string') URL.revokeObjectURL(url);
};

export default downloadFile;
