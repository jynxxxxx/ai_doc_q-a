export type Document = {
  id: string;
  filename: string;
};

export type ChatMessage = {     
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
};

export type Citation = {
  filename: string;
  chunk_index: number;
  snippet: string;
};

export type User = {
  name: string;
  email: string;
}