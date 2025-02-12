import { fetchWithAuth } from "../../server/middlewares/fetchWithAuth";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetchWithAuth("http://localhost:5000/logout", {
        method: "POST",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
