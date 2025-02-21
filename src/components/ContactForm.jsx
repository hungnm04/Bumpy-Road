import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./ContactFormStyles.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors({ ...errors, [e.target.name]: "" }); // Clear error on change
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, subject, message } = formData;

    if (!name) newErrors.name = "Please enter your name.";
    if (!email) newErrors.email = "Please enter your email.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address.";
    if (!subject) newErrors.subject = "Please enter a subject.";
    if (!message) newErrors.message = "Please enter a message.";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setBackendError("");

    try {
      const response = await fetch("http://localhost:5000/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        setBackendError(result.message || "An error occurred. Please try again.");
        toast.error(result.message || "An error occurred. Please try again.");
      } else {
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setErrors({});
      }
    } catch (error) {
      console.error("Error during FAQ submission:", error);
      setBackendError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <Toaster position="top-center" reverseOrder={false} />
      <h1>Send a message to us!</h1>
      {backendError && <p className="error backend-error">{backendError}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          {errors.name && <p className="error">{errors.name}</p>}
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "error-input" : ""}
          />
        </div>
        <div className="form-group">
          {errors.email && <p className="error">{errors.email}</p>}
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "error-input" : ""}
          />
        </div>
        <div className="form-group">
          {errors.subject && <p className="error">{errors.subject}</p>}
          <input
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            className={errors.subject ? "error-input" : ""}
          />
        </div>
        <div className="form-group">
          {errors.message && <p className="error">{errors.message}</p>}
          <textarea
            name="message"
            placeholder="Message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            className={errors.message ? "error-input" : ""}
          ></textarea>
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send message"}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
