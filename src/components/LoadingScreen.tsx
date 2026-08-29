/** Matches the static index.html splash so there's no flash once React takes over. */
export const LoadingScreen = () => (
  <div className="splash" role="status" aria-label="Loading Day">
    <p className="splash-mark">Day</p>
    <div className="splash-spinner" />
  </div>
);
