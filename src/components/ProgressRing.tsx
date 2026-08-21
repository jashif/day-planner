interface ProgressRingProps {
  percent: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ProgressRing = ({ percent }: ProgressRingProps) => {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="hero-right">
      <svg className="ring" viewBox="0 0 120 120" width="88" height="88" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={RADIUS} />
        <circle
          className="ring-fill"
          cx="60"
          cy="60"
          r={RADIUS}
          style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: offset }}
        />
      </svg>
      <span className="ring-label">{percent}%</span>
    </div>
  );
};
