import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signUp } from "../apis";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { email, password, name };
    try {
      if (mode === "signup") {
        const signUpRes = await signUp(data);
        if (!signUpRes || signUpRes.detail) {
          throw new Error(signUpRes?.detail || "Signup failed");
        }
      }
      const res = await login(data)
      if (!res) throw new Error(res.detail || "Error");
      
      setUser(res);

      toast.success(`${mode} successful!`);
      navigate("/documents");
    } catch (err: any) {
      console.error("err", err);
      if (err.response?.data?.detail.includes("duplicate key value violates unique constraint")) {
        toast.error("Email already registered. Please login.");
        setMode("login");
        return;
      }
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-[25vh] p-8">
      <div className="p-8 text-center bg-white max-w-md mx-auto rounded shadow space-y-4">
        <div className="mb-8 text-center text-2xl font-bold">
          {mode === "login" 
            ? <div>Login</div>
            : <div>Sign Up</div>
          }
        </div>
        <form onSubmit={handleSubmit} className="space-y-2">
          {mode === "signup" &&
            <input
              type="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border p-2 w-full rounded bg-white"
            />
          }
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border p-2 w-full rounded bg-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border p-2 w-full rounded bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-[#512153] text-white px-4 py-2 rounded hover:bg-[#512153]/80 w-full disabled:opacity-50"
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>
        <div className="mt-4 text-center">
          {mode === "login" 
            ? <span>Not registered?{" "}Click here to <button className="underline hover:text-blue-500" onClick={() => setMode("signup")}>sign up.</button></span>
            : <span>Already registered?{" "}Click here to <button className="underline hover:text-blue-500" onClick={() => setMode("login")}>login.</button></span>
          }
        </div>
      </div>
    </div>
  );
}
