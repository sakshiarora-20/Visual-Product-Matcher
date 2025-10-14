import React, { useState } from "react";
import UploadSection from "./components/UploadSection.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);

  return (
    <div className="app-container">
      <h1>👗 Visual Product Matcher</h1>
      <UploadSection setResults={setResults} />
      <ProductGrid results={results} />
    </div>
  );
}

export default App;
