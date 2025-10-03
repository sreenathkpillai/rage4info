export default function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p className="loading-text">Loading content...</p>

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: var(--spacing-lg);
        }

        .loading-text {
          color: var(--text-muted);
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}