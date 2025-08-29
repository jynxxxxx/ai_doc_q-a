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
    <div className="absolute top-0 bottom-0 left-0 w-1/10 bg-gray-200 flex flex-col justify-between py-8">
      <div className="flex flex-col gap-8">
        <div onClick={()=> navigate("/documents")}>Documents</div>
        <div onClick={()=> navigate("/chat")}>Chats</div>
      </div>
      {user && <div onClick={handleLogout}>Logout</div>}
    </div>
  )
}