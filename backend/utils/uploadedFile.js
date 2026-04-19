const getUploadedFilePayload = (file = {}) => ({
  url: file.path || file.secure_url || file.url || file.location || '',
  publicId: file.filename || file.public_id || file.key || ''
});

module.exports = { getUploadedFilePayload };
