import { useState, useRef } from "react";
import { uploadDocument } from "../apis";
import type { Document } from "../types"; // adjust to your Document type
import { toast } from "sonner";

type DocumentUploadProps = {
  onUploadComplete: (newDocs: Document[]) => void;
};

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
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
        const doc = await uploadDocument(file); // use helper
        uploadedDocs.push(doc);
      }

      onUploadComplete(uploadedDocs);
      setSelectedFiles([]);
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
        className="border-dashed border-2 border-gray-400 rounded p-6 text-center cursor-pointer mb-2"
        onClick={() => inputRef.current?.click()}
      >
        {selectedFiles.length
          ? selectedFiles.map((f) => f.name).join(", ")
          : <>
              Upload Files or
              <br />
              Drag & drop files here
            </>
          }
      </div>

      <input
        type="file"
        multiple
        className="hidden"
        ref={inputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf" 
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleUpload}
        disabled={uploading || !selectedFiles.length}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}