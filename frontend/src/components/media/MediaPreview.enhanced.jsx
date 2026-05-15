/**
 * MediaPreview.jsx - Complete Media File Preview Component
 * Supports: Images, PDFs, Videos, Documents with detailed info panel
 */

import React, { useState } from 'react';
import { X, Download, Trash2, Share2, File, Music, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * File Icon Renderer
 */
const getFileIcon = (extension, mimeType) => {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType?.startsWith('video/')) return '🎬';
  if (mimeType?.startsWith('audio/')) return '🎵';
  if (extension === 'pdf') return '📄';
  if (['doc', 'docx'].includes(extension)) return '📝';
  if (['xls', 'xlsx'].includes(extension)) return '📊';
  if (['ppt', 'pptx'].includes(extension)) return '🎪';
  return '📎';
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Media Preview Modal
 */
export const MediaPreview = ({ file, workspaceId, onClose, onDelete }) => {
  const [downloading, setDownloading] = useState(false);

  if (!file) return null;

  // ========== RENDER PREVIEW BASED ON FILE TYPE ==========
  const renderPreview = () => {
    if (file.mimeType?.startsWith('image/')) {
      return (
        <img
          src={`/api/workspaces/${workspaceId}/media/${file._id}/serve`}
          alt={file.originalName}
          className="max-h-[70vh] max-w-full object-contain rounded-lg"
        />
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <iframe
          src={`/api/workspaces/${workspaceId}/media/${file._id}/serve#toolbar=0`}
          width="100%"
          height="600px"
          title={file.originalName}
          className="rounded-lg"
        />
      );
    }

    if (file.mimeType?.startsWith('video/')) {
      return (
        <video
          controls
          className="max-h-[70vh] max-w-full rounded-lg"
          style={{ width: '100%' }}
        >
          <source
            src={`/api/workspaces/${workspaceId}/media/${file._id}/serve`}
            type={file.mimeType}
          />
          Your browser doesn't support video playback
        </video>
      );
    }

    if (file.mimeType?.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <Music size={64} className="text-slate-400" />
          <p className="text-lg font-semibold text-slate-700">{file.originalName}</p>
          <audio controls className="w-full">
            <source
              src={`/api/workspaces/${workspaceId}/media/${file._id}/serve`}
              type={file.mimeType}
            />
          </audio>
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <FileText size={64} className="text-slate-400" />
        <p className="text-lg font-semibold text-slate-700">{file.originalName}</p>
        <p className="text-sm text-slate-500">Preview not available for this file type</p>
        <button
          onClick={() => handleDownload()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Download size={16} />
          Download File
        </button>
      </div>
    );
  };

  // ========== DOWNLOAD HANDLER ==========
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await axios.get(
        `/api/workspaces/${workspaceId}/media/${file._id}/serve`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  // ========== DELETE HANDLER ==========
  const handleDelete = async () => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await axios.delete(
        `/api/workspaces/${workspaceId}/media/${file._id}`
      );
      toast.success('File deleted');
      onDelete?.(file._id);
      onClose();
    } catch (err) {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white shadow-xl">
        
        {/* ========== HEADER ========== */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* ========== CONTENT AREA ==========*/}
        <div className="flex gap-6 p-6">
          
          {/* ========== PREVIEW SECTION ========== */}
          <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-lg p-4">
            {renderPreview()}
          </div>

          {/* ========== DETAILS PANEL ========== */}
          <div className="w-80 bg-slate-50 rounded-lg p-4 space-y-4 border border-slate-200">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">File Info</p>
              <h4 className="text-sm font-bold text-slate-900 mt-1 break-words">{file.originalName}</h4>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div>
                <p className="text-xs text-slate-600 font-medium">Size</p>
                <p className="text-sm text-slate-900 font-semibold">{formatFileSize(file.size)}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 font-medium">Type</p>
                <p className="text-sm text-slate-900">{file.extension?.toUpperCase() || 'Unknown'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 font-medium">Uploaded By</p>
                <p className="text-sm text-slate-900">{file.uploadedBy?.name || 'Unknown'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-600 font-medium">Uploaded Date</p>
                <p className="text-sm text-slate-900">
                  {new Date(file.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600 font-medium">Downloads</p>
                <p className="text-sm text-slate-900">{file.downloadCount || 0}</p>
              </div>

              {file.tags?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-600 font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {file.description && (
                <div>
                  <p className="text-xs text-slate-600 font-medium">Description</p>
                  <p className="text-sm text-slate-700 mt-1">{file.description}</p>
                </div>
              )}
            </div>

            {/* ========== ACTIONS ========== */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-medium py-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? 'Downloading...' : 'Download'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `/api/workspaces/${workspaceId}/media/${file._id}/serve`
                  );
                  toast.success('Link copied!');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium py-2 hover:bg-slate-50"
              >
                <Share2 size={16} />
                Copy Link
              </button>

              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-medium py-2 hover:bg-red-100"
              >
                <Trash2 size={16} />
                Delete File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
