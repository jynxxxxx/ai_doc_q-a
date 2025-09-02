import axios from "axios";
import type { Citation, Document } from "./types";

const baseURL = "http://localhost:8000"

export const customAPI = axios.create({
  baseURL,
  withCredentials: true,
});

export const signUp = async (data: any) => {
  const res = await customAPI.post(`${baseURL}/auth/signup`, data, {
    withCredentials: true,
  });

  return res.data;
};

export const login = async (data: any) => {
  const res = await customAPI.post(`${baseURL}/auth/login`, data, {
    withCredentials: true,
  });

  return res.data;
};

export const logout = async () => {
  const res = await customAPI.post(`${baseURL}/auth/logout`, {}, {
    withCredentials: true,
  });

  return res.data;
};

export const refreshUser = async() => {
  const res = await customAPI.get("/auth/me", {
    withCredentials: true,
  });

  return res.data;
}

export const uploadDocument = async (file: File): Promise<Document> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await customAPI.post(`${baseURL}/documents/upload`, formData, {
    withCredentials: true,
  });

  return res.data;
};

export const getDocuments = async (): Promise<Document[]> => {
  const res = await customAPI.get(`${baseURL}/documents/`, { withCredentials: true });
  return res.data;
};

export const deleteDocument = async (docId: string) => {
  await customAPI.delete(`${baseURL}/documents/${docId}`, { withCredentials: true });
};

export const getDocumentURL = async (docId: string) => {
  const res = await customAPI.get(`${baseURL}/documents/${docId}`, {
    responseType: "blob",
    withCredentials: true 
  });

  const blob = new Blob([res.data], { type: res.data.type || "application/pdf" });
  return URL.createObjectURL(blob);
};

export const getDocumentText = async (docId: string): Promise<string> => {
  const res = await customAPI.get(`${baseURL}/documents/${docId}/text`, { withCredentials: true });
  return res.data.text;
};

export const chatStream = async (
  question: string,
  onChunk: (chunk: string) => void,
  onCitations: (citations: Citation[]) => void,
  signal?: AbortSignal
) => {

  const res = await fetch(`${baseURL}/chat`, {
    method: "POST",
    body: JSON.stringify({ question }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    signal
  });

  if (!res.body) throw new Error("No reader available");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Split buffer by new lines
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "citations") {
          onCitations(parsed.data);
        } else if (parsed.type === "chunk") {
          onChunk(parsed.data);
        }
      } catch (e) {
        console.error("Failed to parse line:", line);
      }
    }
  }

  // Flush any remaining buffered text
  if (buffer) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.type === "chunk") onChunk(parsed.data);
      else if (parsed.type === "citations") onCitations(parsed.data);
    } catch {}
  }
};