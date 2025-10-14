import React, { useState } from "react";

function UploadSection({ setResults }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setSelectedImage(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedImage) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", selectedImage);

    // Call backend API (Flask)
    const response = await fetch("http://127.0.0.1:5000/match", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div className="upload-section">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Find Similar Products"}
      </button>

      {selectedImage && (
        <div className="preview">
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Preview"
            width="200"
          />
        </div>
      )}
    </div>
  );
}

export default UploadSection;
