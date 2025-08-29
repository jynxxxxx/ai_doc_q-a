
export default function Citation({ filename, snippet }: { filename: string, snippet: string }) {
  // Escape special characters for regex
  const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return (
    <div className="border rounded p-2 my-2 max-h-64 overflow-y-auto bg-white">
      <div className="font-bold mb-1">{filename}</div>
      <div>
        {escaped}
      </div>
    </div>
  );
}