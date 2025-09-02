import { useNavigate } from "react-router-dom";
import { logout } from "../apis";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function NavBar() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth()

  const handleLogout = async() => {
    try {
      const res = await logout()
      setUser(null);    
      toast.success(res.data)       
      navigate("/login"); 
    } catch (err) {
      console.error("Logout failed", err);
    } finally{
      console.log("user", user)
    }
  }

  return (
    <div className="fixed top-0 h-full left-0 w-[15vw] bg-gray-200 flex flex-col justify-between p-8">
      <div className="flex flex-col gap-8">
        <div className="hover:text-gray-500" onClick={()=> navigate("/documents")}>Documents</div>
        <div className="hover:text-gray-500" onClick={()=> navigate("/chat")}>Chats</div>
      </div>
      {user && <div className="hover:text-gray-500" onClick={handleLogout}>Logout</div>}
    </div>
  )
}