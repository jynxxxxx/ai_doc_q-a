import { useNavigate } from "react-router-dom";

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <div className="absolute top-0 bottom-0 left-0 w-1/10 bg-gray-200 flex flex-col gap-8 py-8">
      <div onClick={()=> navigate("/documents")}>Documents</div>
      <div onClick={()=> navigate("/chat")}>Chats</div>
    </div>
  )
}