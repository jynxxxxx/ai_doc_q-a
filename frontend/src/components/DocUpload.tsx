import { useState, useRef } from "react";
import { uploadDocument } from "../apis";
import type { Document } from "../types"; // adjust to your Document type
import { toast } from "sonner";
import { Upload, FileText, X } from 'lucide-react';

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

    if (validFiles.length) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
    }
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
    <div className="mb-4 h-full w-full">
      {selectedFiles.length > 0 && (
        <>
          <div className="mt-6 space-y-3 grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {selectedFiles.map((file) => (
              <div key={file.name} className="relative flex bg-gray-100 gap-2 rounded-lg h-full px-2 py-4">
                <div className="w-8 h-8 flex justify-center items-center bg-white rounded-full border flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

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
                    className="absolute right-2 top-2 mt-auto self-end text-gray-500 hover:text-gray-700 p-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="max-w-3xl mx-auto flex gap-4">
            <button
              className="mt-6 w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              onClick={handleUpload}
              disabled={uploading || !selectedFiles.length}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <div className="min-w-fit">
              <input
                type="file"
                id="file-input"
                multiple
                className="hidden"
                ref={inputRef}
                onChange={(e) => handleFiles(e.target.files)}
                accept=".pdf" 
              />
              <label htmlFor="file-input" className="flex mt-6 w-full py-2 px-4 rounded-lg text-sm justify-center items-center border border-gray-300 cursor-pointer rounded hover:bg-gray-100">
                <Upload className="w-4 h-4 mr-2" />
                Add More Files
              </label>
            </div>
          </div>
        </>
      )}

      {selectedFiles.length == 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="p-8 text-center cursor-pointer h-full max-w-md border border-gray-300 p-4 rounded mx-auto flex flex-col justify-center items-center hover:bg-gray-50"
          onClick={() => inputRef.current?.click()}
        >
          
          {selectedFiles.length
            ? selectedFiles.map((f) => f.name).join(", ")
            : (
              <div className="space-y-2">
                <p className="font-bold text-regular">Upload your documents</p>
                <p className="text-gray-600 text-xs">Drag & drop PDFs here, or click to browse</p>
              </div>
            )
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
          <label htmlFor="file-input" className="flex mt-4 mx-auto w-fit px-4 py-2 text-sm justify-center items-center border border-gray-300 cursor-pointer rounded hover:bg-gray-100">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </label>
        </div>
    )}
    </div>
  );
}