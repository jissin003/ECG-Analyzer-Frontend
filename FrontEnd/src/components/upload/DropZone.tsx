//edited on 20 febaruary

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image as ImageIcon, Eye, Trash } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface FileWithPreview extends File {
  preview?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate(); 

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit';
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_FILE_TYPES.includes(fileExtension)) {
      return 'Invalid file type';
    }

    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const newFiles = Array.from(e.dataTransfer.files);

    newFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setFiles((prev) => [...prev, Object.assign(file, { preview })]);
      } else {
        setFiles((prev) => [...prev, file]);
      }
    });
  }, []);

  const handleBrowseFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        alert(error);
        return;
      }

      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setFiles((prev) => [...prev, Object.assign(file, { preview })]);
      } else {
        setFiles((prev) => [...prev, file]);
      }
    });
  }, []);

  const handleUpload = useCallback(() => {
    setUploadProgress(0);
    setUploadCompleted(false);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setUploadCompleted(true);
          return null;
        }
        return prev + 10;
      });
    }, 500);
  }, []);

  const handleShowResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
      >
        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()} // Open file picker on click
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-700'
          }`}
        >
          <div className="flex flex-col items-center">
            <Upload className="mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              Drag and drop your files here, or{' '}
              <span className="mx-1 text-blue-600 hover:text-blue-500">
                click to select
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: PDF, JPG, PNG (max 10MB)
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          className="hidden"
          onChange={handleBrowseFiles}
        />

        {/* Files List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div className="mt-6 space-y-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-4">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-8 w-8 text-blue-500" />
                    ) : (
                      <FileText className="h-8 w-8 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {file.preview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.preview, '_blank')}
                      >
                        <Eye size={16} />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiles(files.filter((_, i) => i !== index));
                        if (file.preview) {
                          URL.revokeObjectURL(file.preview);
                        }
                      }}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {uploadProgress !== null && (
                <motion.div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-blue-600"
                  />
                </motion.div>
              )}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setFiles([])}>
                  Clear All
                </Button>
                <Button onClick={handleUpload} disabled={uploadProgress !== null}>
                  Upload Files
                </Button>
              </div>

              {uploadCompleted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button
                    className="w-full mt-4"
                    onClick={() => navigate('/dashboard/results')} // ✅ Redirect to /results
                  >
                    Show Results
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
