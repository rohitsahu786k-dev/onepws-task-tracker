import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import useAuthStore from '../../store/authStore';
import * as mediaService from '../../services/media.service';
import toast from 'react-hot-toast';

const MediaLibrary = () => {
  const { workspace } = useAuthStore();
  const queryClient = useQueryClient();
  const workspaceId = workspace?._id || 'mock-workspace-id';

  const [uploadProgress, setUploadProgress] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['media', workspaceId],
    queryFn: () => mediaService.getMediaFiles(workspaceId),
    enabled: !!workspaceId,
  });

  const uploadMutation = useMutation({
    mutationFn: (files) => mediaService.uploadMedia(workspaceId, files, (event) => {
      const percent = Math.round((event.loaded * 100) / event.total);
      setUploadProgress(percent);
    }),
    onSuccess: () => {
      toast.success('Files uploaded successfully');
      setUploadProgress(null);
      queryClient.invalidateQueries(['media', workspaceId]);
    },
    onError: (err) => {
      toast.error('Upload failed');
      setUploadProgress(null);
      console.error(err);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => mediaService.deleteMedia(workspaceId, id),
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries(['media', workspaceId]);
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if(acceptedFiles.length > 0) {
        uploadMutation.mutate(acceptedFiles);
      }
    }
  });

  const getFileIcon = (category) => {
    switch(category) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'pdf': return '📄';
      default: return '📁';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Media Library</h1>
        
        {/* Simple Drag and Drop Dropzone Top Area */}
        <div {...getRootProps()} className={`px-6 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
          <input {...getInputProps()} />
          {
            uploadProgress !== null 
              ? <p className="text-sm font-medium text-primary">Uploading... {uploadProgress}%</p>
              : <p className="text-sm text-slate-500">Drag & drop files here, or click to upload</p>
          }
        </div>
      </div>

      {isLoading ? (
        <div className="p-8">Loading Media...</div>
      ) : (
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data?.data?.map(file => (
              <div key={file._id} className="relative group border dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-900 flex flex-col">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {file.fileCategory === 'image' ? (
                    <img 
                      src={mediaService.getPreviewUrl(workspaceId, file._id)} 
                      alt={file.displayName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-4xl">{getFileIcon(file.fileCategory)}</span>
                  )}
                </div>
                
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate" title={file.displayName}>
                      {file.displayName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  
                  {/* Actions overlay / footer */}
                  <div className="mt-3 flex items-center justify-between">
                    <a 
                      href={mediaService.getDownloadUrl(workspaceId, file._id)} 
                      download
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Download
                    </a>
                    <button 
                      onClick={() => {
                        if(confirm('Delete this file?')) deleteMutation.mutate(file._id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {(!data?.data || data.data.length === 0) && (
              <div className="col-span-full py-12 text-center text-slate-500">
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
