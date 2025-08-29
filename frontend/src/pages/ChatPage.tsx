import { useState, useEffect } from "react";
import Chat from '../components/Chat'
import DocumentUpload from '../components/DocUpload'
import { getDocuments } from "../apis";
import type { Document } from "../types";

function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

   useEffect(() => {
      const fetchDocuments = async () => {
        const docs = await getDocuments();
        setDocuments(docs);
      };
  
      fetchDocuments();
    }, []);

  return (
    <>
      <Chat />
      <div className="my-4">
        RAG documents:
        {!documents || documents.length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
        <div className="flex items-center gap-2">
          {documents.map((doc) => (
            <div key={doc.id} className="w-fit text-xs p-2 border rounded">
              {doc.filename}
            </div>
          ))}
        </div>
        )}
      </div>
      
      <DocumentUpload onUploadComplete={(newDocs: any) => setDocuments([...documents, ...newDocs])}/>
    </>
  )
}

export default ChatPage