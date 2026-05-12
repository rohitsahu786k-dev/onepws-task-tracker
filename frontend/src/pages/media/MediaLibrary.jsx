import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { FileArchive, FileText, Image, UploadCloud, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import * as mediaService from '../../services/media.service';

const getWorkspaceId = (workspace) => workspace?._id || workspace?.id || workspace || null;

const getFileIcon = (category) => {
  switch (category) {
    case 'image': return Image;
    case 'video': return Video;
    case 'pdf': return FileText;
    default: return FileArchive;
  }
};

const MediaLibrary = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = getWorkspaceId(workspace);
  const [uploadProgress, setUploadProgress] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', workspaceId],
    queryFn: () => mediaService.getMediaFiles(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => mediaService.uploadMedia(workspaceId, files, (event) => {
      const percent = Math.round((event.loaded * 100) / event.total);
      setUploadProgress(percent);
    }),
    onSuccess: () => {
      toast.success('Files uploaded successfully');
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Upload failed');
      setUploadProgress(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mediaService.deleteMedia(workspaceId, id),
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['media', workspaceId] });
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) uploadMutation.mutate(acceptedFiles);
    },
  });

  if (!workspaceId) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-950">
        <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Select a workspace to use Media Library</h1>
        <p className="mt-2 text-sm text-slate-500">Folders, files, versions, and usage tracking are isolated per workspace.</p>
        <Link to="/workspaces/new" className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
          Create workspace
        </Link>
      </div>
    );
  }

  const files = data?.data || data?.files || [];

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Media Library</h1>
          <p className="mt-1 text-sm text-slate-500">Upload, preview, download, and manage workspace assets.</p>
        </div>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-3 transition ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud size={20} className="text-primary" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {uploadProgress !== null ? `Uploading ${uploadProgress}%` : 'Upload files'}
            </p>
            <p className="text-xs text-slate-500">Drag files here or click to browse</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-md bg-slate-200 dark:bg-slate-900" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {files.map((file) => {
              const Icon = getFileIcon(file.fileCategory);
              return (
                <article key={file._id} className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {file.fileCategory === 'image' ? (
                      <img
                        src={mediaService.getPreviewUrl(workspaceId, file._id)}
                        alt={file.displayName}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Icon className="size-10 text-slate-400" />
                    )}
                  </div>

                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white" title={file.displayName}>
                      {file.displayName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Size unavailable'}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <a href={mediaService.getDownloadUrl(workspaceId, file._id)} download className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        Download
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this file?')) deleteMutation.mutate(file._id);
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {!files.length && (
              <div className="col-span-full rounded-md border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
                No files in the media library yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
