import { createContext, useContext, useState, useCallback, useMemo  } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // Check for both 'token' and 'authToken' for backward compatibility
    return localStorage.getItem("token") || localStorage.getItem("authToken");
  });
  const [userEmail, setuserEmail] = useState(localStorage.getItem("userEmail"));
  const [adminEmail, setadminEmail] = useState(localStorage.getItem("adminEmail"));

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      // This is where you would typically make an API call to your backend
      // For now, we'll just set the token and user from the credentials
      const { token, email } = credentials;
      
      // In a real app, you would verify the token with your backend
      localStorage.setItem("token", token);
      setToken(token);
      
      // Set user data
      const userData = { email }; // Add other user data as needed
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const storagetokenLS = (token) => {
    localStorage.setItem("token", token);
    setToken(token); // update state!
  };
  const storeuserEmailLS = (userEmail) => {
    localStorage.setItem("userEmail", userEmail);
    setuserEmail(userEmail); // update state!
  };
  const storeadminEmailLS = (adminEmail) => {
    localStorage.setItem("adminEmail", adminEmail);
    setadminEmail(adminEmail); // update state!
  };

  // Use useMemo for isLoggedIn to prevent unnecessary re-renders
  const isLoggedIn = useMemo(() => {
    const loggedIn = !!token;
    console.log('Auth Store - token:', token);
    console.log('Auth Store - isLoggedIn:', loggedIn);
    return loggedIn;
  }, [token]);

  const LogoutUser = () => {
    setToken("");
    setuserEmail("");
    setadminEmail("");
    storagetokenLS("");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken"); // Also remove authToken for backward compatibility
    localStorage.removeItem("userEmail");
    localStorage.removeItem("adminEmail");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  
  // Update user data
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Test function to manually set authentication state
  const setTestAuth = useCallback((email, testToken = 'test-token') => {
    console.log('Setting test auth:', email, testToken);
    setToken(testToken);
    setuserEmail(email);
    localStorage.setItem('token', testToken);
    localStorage.setItem('userEmail', email);
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => !!token, [token]);
  
  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      token,        // <-- expose token
      userEmail,        // <-- expose email
      setuserEmail,     // expose setEmail for immediate update after login
      setToken,     // expose setToken if needed
      storagetokenLS,
      storeuserEmailLS,
      LogoutUser,
      storeadminEmailLS,
      adminEmail, // <-- expose studentEmail
      setadminEmail, // expose setStudentEmail for immediate update after login
      user,        // <-- expose user object
      setUser,     // expose setUser for immediate update after login
      updateUser,  // expose updateUser function
      isAuthenticated, // expose isAuthenticated function
      login,       // expose login function
      isLoading,
      setIsLoading, // expose setIsLoading function
      setTestAuth, // expose test function
         // expose isLoading state
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const authContextValue = useContext(AuthContext);
  if (!authContextValue) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return authContextValue;
}