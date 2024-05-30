import "./styles.css";
import { Route, Routes } from "react-router-dom";
import About from "./routes/About";
import Places from "./routes/Places";
import BlogPage from "./routes/BlogPage";
import FAQ from "./routes/FAQ";
import HomePage from "./routes/HomePage";
import Login from "./routes/Login";
import CreateAccount from "./routes/CreateAccount";
import AdminDashboard from "./routes/AdminDashboard";
import AuthenticatedHome from "./routes/AuthenticatedHome";

export default function App() { 
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/About" element={<About />} />
        <Route path="/Places" element={<Places />} />
        <Route path="/BlogPage" element={<BlogPage />} />
        <Route path="/FAQ" element={<FAQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/authenticated-home" element={<AuthenticatedHome />} />
        <Route path="/create-account" element={<CreateAccount />} />{" "}
      </Routes>
    </div>
  );
}

