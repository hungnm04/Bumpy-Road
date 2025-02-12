import "./styles.css";
import { Route, Routes } from "react-router-dom";
import About from "./pages/About";
import Places from "./pages/Places";
import BlogPage from "./pages/BlogPage";
import FAQ from "./pages/FAQ";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import PageNotFound from "./components/PageNotFound";
import MountainDetails from "./components/MountainDetails";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthRoute from "./routes/AuthRoute";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/About" element={<About />} />
        <Route path="/Places" element={<Places />} />
        <Route path="/BlogPage" element={<BlogPage />} />
        <Route path="/FAQ" element={<FAQ />} />
        <Route path="/login" element={<AuthRoute element={<Login />} />} />
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />
          }
        />
        <Route
          path="/profile"
          element={<ProtectedRoute element={<Profile />} />}
        />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/places/:id" element={<MountainDetails />} />
        <Route path="/create-account" element={<CreateAccount />} />{" "}
      </Routes>
    </div>
  );
}
