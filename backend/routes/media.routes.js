const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, verifyWorkspaceAccess, checkModuleEnabled, checkPermission } = require('../middleware/auth.middleware');
const { uploadMediaLib } = require('../config/multerMedia');
const ctrl = require('../controllers/media.controller');

router.use(protect);
router.use(verifyWorkspaceAccess);
// For Media Library module
// Sometimes attachments in tasks happen without Media library module enabled, but for direct media routes, we check it.
router.use(checkModuleEnabled('media'));

// Folders
router.get('/folders', checkPermission('media', 'view'), ctrl.getFolders);
router.post('/folders', checkPermission('media', 'manage_folders'), ctrl.createFolder);

// Files
router.get('/', checkPermission('media', 'view'), ctrl.getMediaFiles);
router.post('/upload', checkPermission('media', 'upload'), uploadMediaLib.array('files', 20), ctrl.uploadMedia);

router.get('/:id/preview', checkPermission('media', 'view'), ctrl.previewMedia);
router.get('/:id/download', checkPermission('media', 'download'), ctrl.downloadMedia);
router.delete('/:id', checkPermission('media', 'delete'), ctrl.deleteMedia);

router.post('/bulk-download', checkPermission('media', 'bulk_download'), ctrl.bulkDownload);

module.exports = router;
