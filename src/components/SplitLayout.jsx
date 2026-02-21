import './SplitLayout.css';

export default function SplitLayout({ left, right }) {
  return (
    <div className="split-layout">
      <div className="split-panel split-left">{left}</div>
      <div className="split-panel split-right">{right}</div>
    </div>
  );
}
