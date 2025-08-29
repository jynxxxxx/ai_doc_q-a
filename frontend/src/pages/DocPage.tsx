import { useState, useEffect } from "react";
import DocUpload from "../components/DocUpload";
import type { Document } from "../types";
import { deleteDocument, getDocuments, getDocumentURL } from "../apis";
import { toast } from "sonner";

export default function DocPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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
    setPdfUrl("")
  };

  const handleView = async (docId: string) => {
    try {
      const url = await getDocumentURL(docId);
      setPdfUrl(url)
    } catch (err) {
      console.error("Failed to open document:", err);
      toast.error("Could not open PDF.")
    };
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <DocUpload onUploadComplete={(newDocs: any) => setDocuments([...documents, ...newDocs])} />

      <h2 className="text-xl font-bold mb-4">Manage Documents</h2>
      <h3 className="font-bold mb-2">Document Library</h3>
      {!documents || documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <span className="font-medium">{doc.filename}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(doc.id)}
                    className="bg-green-600 text-white px-2 py-1 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pdfUrl && (
            <iframe src={pdfUrl} width="100%" height="600px" style={{ border: "none" }} />
          )}
        </>
      )}
    </div>
  );
}