import { Navigate } from "react-router-dom";

// Redirect to dashboard - in production this would check auth state
const Index = () => {
  return <Navigate to="/dashboard" replace />;
};

export default Index;
