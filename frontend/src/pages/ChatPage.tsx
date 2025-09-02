import { useState, useEffect } from "react";
import Chat from '../components/Chat'
import DocUpload from '../components/DocUpload'
import { getDocuments } from "../apis";
import type { Document } from "../types";
import { Plus, X } from 'lucide-react';


function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [openUpload, setOpenUpload] = useState(false);

   useEffect(() => {
      const fetchDocuments = async () => {
        const docs = await getDocuments();
        setDocuments(docs);
      };
  
      fetchDocuments();
    }, []);

  return (
    <div className="p-12">
      <div className="flex items-end gap-2">
        <h2 className="text-left text-xl font-bold ml-12 mb-4 ">AI Chat</h2>
        <span className="text-sm text-gray-500 mb-5">- Chat with your documents</span>
      </div>
      <div className="h-pt border border-b mb-6"></div>
      <Chat />
      <div className="my-4 max-w-4xl mx-auto">
        <div className="relative mb-4">
          RAG documents:
          <div 
            className="absolute top-0 right-0 w-fit text-xs flex justify-center items-center gap-1 rounded-lg border p-2 bg-white text-gray-700 hover:text-gray-500 hover:border-gray-500 hover:cursor-pointer"
            onClick={()=> setOpenUpload(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="">Upload Documents</span>
          </div>
        </div>
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
      
      {openUpload && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-start pt-20 z-50 w-full">
          <div className="relative mt-4 h-48 bg-white w-3/5 h-[60vh] p-6 rounded-lg shadow-lg flex justify-center items-center flex-col">
            <button
              onClick={() => setOpenUpload(false)}
              className="absolute right-2 top-2 mt-auto self-end text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
            <DocUpload
              onUploadComplete={(newDocs: Document[]) => {
                setDocuments([...documents, ...newDocs]);
                setOpenUpload(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatPage