
function ProductGrid({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="product-grid">
      {results.map((item, idx) => (
        <div key={idx} className="product-card">
          <img src={item.image} alt={item.name} />
          <p>{item.name}</p>
          <small>{item.category}</small>
          <p>Similarity: {item.score.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
