import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import { refreshUser } from "../apis";

interface AuthContextValue {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // call this on mount or when you want to refresh user
  const resetUser = async () => {
    try {
      const res = await refreshUser()
      setUser(res);
    } catch (err) {
      console.error("Failed to refresh user, keeping existing state", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetUser();
    const interval = setInterval(resetUser, 1000 * 60 * 5); // every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

// Custom hook for convenience
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
