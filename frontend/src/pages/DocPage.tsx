import { useState, useEffect } from "react";
import DocUpload from "../components/DocUpload";
import type { Document } from "../types";
import { deleteDocument, getDocuments, getDocumentURL } from "../apis";
import { toast } from "sonner";
import { FileText, Eye, Trash2 } from 'lucide-react';

export default function DocPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      const docs = await getDocuments();
      setDocuments(docs);
    };

    fetchDocuments();
  }, []);

  const handleDelete = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    await deleteDocument(docId);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleView = async (docId: string) => {
    try {
      const url = await getDocumentURL(docId);
      const newTab = window.open(url, "_blank");
      if (newTab) newTab.focus();
      else toast.error("Please allow popups to view PDF.");
    } catch (err) {
      console.error("Failed to open document:", err);
      toast.error("Could not open PDF.")
    };
  }

  return (
    <div className="p-12">
      <h2 className="text-left text-xl font-bold ml-12 mb-4 ">Manage Documents</h2>
      <div className="h-pt border border-b mb-12"></div>
      {!documents || documents.length === 0 ? (
        <>
          <div className="text-center">You have no documents uploaded yet. Upload PDFs to get started.</div>            
          <div className="mt-4 mx-auto h-48">
            <DocUpload onUploadComplete={(newDocs: any) => setDocuments([...documents, ...newDocs])} />
          </div>
        </>
      ) : (
        <>
          <h3 className="font-bold mb-2">Document Library</h3>
          <div className="grid grid-cols-4 gap-4 mx-auto mb-6">
            {documents.map((doc) => (
              <div key={doc.id} className="border px-2 pt-4 pb-2 rounded h-full flex flex-col gap-4 items-center justify-between">
                <div className="w-12 h-12 flex justify-center items-center bg-white rounded-lg border flex-shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center h-full">{doc.filename}</div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="px-2 py-1 rounded"
                  >
                    <Eye className="w-4 h-4 hover:text-gray-700 hover:scale-[1.05]" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="border px-2 py-1 rounded hover:text-gray-700 hover:scale-[1.05]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}