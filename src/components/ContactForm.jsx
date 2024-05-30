import React, { useState } from "react";
import "./ContactFormStyles.css";

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ name: "", email: "", subject: "", message: "" });
  const [backendError, setBackendError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let isValid = true;
    const newErrors = { name: "", email: "", subject: "", message: "" };

    // Validate form fields
    if (!name) {
      newErrors.name = "Please enter your name"; // Set error message for name field
      isValid = false;
    }
    if (!email) {
      newErrors.email = "Please enter your email"; // Set error message for email field
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address"; // Set error message for invalid email format
      isValid = false;
    }
    if (!subject) {
      newErrors.subject = "Please enter a subject"; // Set error message for subject field
      isValid = false;
    }
    if (!message) {
      newErrors.message = "Please enter a message"; // Set error message for message field
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setBackendError("");

    try {
      const response = await fetch("http://localhost:5000/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) {
        const result = await response.json();
        setBackendError(result.message || "An error occurred. Please try again.");
      } else {
        alert("Message sent successfully!");
        // Reset form fields after successful submission
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setErrors({ name: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error("Error during FAQ submission:", error);
      setBackendError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Send a message to us!</h1>
      {backendError && <p className="error">{backendError}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            placeholder={"Name"} 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? "error-input" : ""}
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>
        <div className="form-group">
          <input
            placeholder={"Email"} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "error-input" : ""}
          />
          {errors.email && <p className="error">{errors.email}</p>}
        </div>
        <div className="form-group">
          <input
            placeholder={"Subject"} 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={errors.subject ? "error-input" : ""}
          />
          {errors.subject && <p className="error">{errors.subject}</p>}
        </div>
        <div className="form-group">
          <textarea
            placeholder={"Message"} 
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={errors.message ? "error-input" : ""}
          ></textarea>
          {errors.message && <p className="error">{errors.message}</p>}
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send message"}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
