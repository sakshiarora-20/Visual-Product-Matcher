import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [predictedCategory, setPredictedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(0.0);
  const [darkMode, setDarkMode] = useState(false);

  const backendURL = "http://127.0.0.1:8000/match";

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setPreview(URL.createObjectURL(uploadedFile));
    setImageUrl("");
    setResults([]);
    setPredictedCategory("");
  };

  const handleUrlChange = (e) => {
    setImageUrl(e.target.value);
    setPreview(e.target.value);
    setFile(null);
    setResults([]);
    setPredictedCategory("");
  };

  const handleSearch = async () => {
    if (!file && !imageUrl) {
      alert("Please upload an image or enter a URL!");
      return;
    }

    try {
      setLoading(true);
      let formData = new FormData();
      let urlParam = "";

      if (file) {
        formData.append("file", file);
      } else if (imageUrl) {
        urlParam = `?url=${encodeURIComponent(imageUrl)}&min_score=${minScore}`;
      }

      const res = await axios.post(
        file ? backendURL : backendURL + urlParam,
        file ? formData : null,
        { headers: file ? { "Content-Type": "multipart/form-data" } : {} }
      );

      setPredictedCategory(res.data.predicted_category);
      setResults(res.data.matches);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error while fetching matches.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) => item.score >= minScore);

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <motion.h1
          className="nav-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Visual Product Matcher
        </motion.h1>
        <motion.button
          className="toggle-btn"
          onClick={() => setDarkMode(!darkMode)}
          whileTap={{ scale: 0.9 }}
        >
          {darkMode ? "☀️" : "🌙"}
        </motion.button>
      </nav>

      {/* Upload Section */}
      <motion.div
        className="upload-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <label htmlFor="file-upload" className="upload-box">
          <span> Click to upload an image</span>
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />

        <span className="divider">or</span>

        <input
          type="text"
          placeholder="Paste image URL here"
          value={imageUrl}
          onChange={handleUrlChange}
        />

        <motion.button
          onClick={handleSearch}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              style={{
                border: "4px solid var(--loader-bg)",
                borderTop: "4px solid var(--primary)",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                margin: "auto"
              }}
            />
          ) : (
            "Find Matches"
          )}
        </motion.button>
      </motion.div>

      {/* Preview Card */}
      {preview && (
        <div className="preview-card">
          <h3>Uploaded Image:</h3>
          <img src={preview} alt="preview" className="preview-image" />

          {predictedCategory && (
            <span className="category-badge">{predictedCategory}</span>
          )}

          {results.length > 0 && (
            <div className="slider-container">
              <label>
                Min Score: {minScore.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.01"
                  value={minScore}
                  onChange={(e) => setMinScore(parseFloat(e.target.value))}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {filteredResults.length > 0 && (
        <motion.div
          className="results-section"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          <h2>Similar Products</h2>
          <div className="results-grid">
            {filteredResults.map((item, idx) => (
              <motion.div
                className="result-card"
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <img
                  src={`http://127.0.0.1:8000/images/${item.image}`}
                  alt="match"
                />
                <p>Score: {item.score.toFixed(2)}</p>
                <p>Category: {item.category}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default App;