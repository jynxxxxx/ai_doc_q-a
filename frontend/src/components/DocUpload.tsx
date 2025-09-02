import { useState, useRef } from "react";
import { uploadDocument } from "../apis";
import type { Document } from "../types"; // adjust to your Document type
import { toast } from "sonner";
import { Upload } from 'lucide-react';

type DocumentUploadProps = {
  onUploadComplete: (newDocs: Document[]) => void;
};

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) {
      toast.error(`There were no uploaded files. Please upload a file and try again.`);
      return
    };

    const validFiles: File[] = [];

    Array.from(files).forEach((f) => {
      const isRegex = /^[\w\s.\-()!@#$%^&+=,;'"~`{}|[\]<>/?\\]+$/.test(f.name);
      if (!isRegex) {
        toast.error(`${f.name} contains non-English characters. Ensure all file names are in English.`);
        return
      }

      if ([".pdf"].some((ext) => f.name.toLowerCase().endsWith(ext))) {
        validFiles.push(f);
      } else {
        toast.error(`${f.name} is not a valid file. Only PDF allowed.`);
      }
    });

    if (validFiles.length) setSelectedFiles(Array.from(validFiles));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);

    try {
      const uploadedDocs: Document[] = [];

      for (const file of selectedFiles) {
        const doc = await uploadDocument(file, (p) => {
          setProgress((prev) => ({ ...prev, [file.name]: p }));
        });
        uploadedDocs.push(doc);
      }

      onUploadComplete(uploadedDocs);
      setSelectedFiles([]);
      setProgress({})
    } catch (err: any) {
      if (err.response?.data?.error.includes("No text could be extracted from the file")) {
        toast.error("No text could be extracted from the file");
        return;
      }
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border p-4 rounded mb-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50"
        onClick={() => inputRef.current?.click()}
      >
        
        {selectedFiles.length
          ? selectedFiles.map((f) => f.name).join(", ")
          : <p className="text-gray-600">Drag & drop PDFs here, or click to browse</p>
        }

        <input
          type="file"
          id="file-input"
          multiple
          className="hidden"
          ref={inputRef}
          onChange={(e) => handleFiles(e.target.files)}
          accept=".pdf" 
        />
        <label htmlFor="file-input" className="flex mt-2 mx-auto w-fit px-2 justify-center items-center border border-gray-300 cursor-pointer rounded">
          <Upload className="w-4 h-4 mr-2" />
          Choose Files
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          {selectedFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                {/* Progress bar */}
                {uploading && (
                  <div className="w-full bg-gray-200 rounded h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded transition-all"
                      style={{ width: `${progress[file.name] || 0}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {!uploading && (
                <button
                  onClick={() => setSelectedFiles((prev) => prev.filter((f) => f.name !== file.name))}
                  className="ml-4 text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && 
        <button
          className="mt-6 w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          onClick={handleUpload}
          disabled={uploading || !selectedFiles.length}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      }
    </div>
  );
}