export default function VoiceAssist({ open, onToggle, showPlanner, showExperience, showVoicePage }) {
  return (
    <div className="float-assist">
      <button className="fa-btn" onClick={onToggle} title="Voice assist">
        {open ? '✕' : '🎙️'}
      </button>

      {open && (
        <div className="assist-pop">
          <div className="ap-top">
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Trailmind Assist</span>
            <button className="ap-x" onClick={onToggle}>&times;</button>
          </div>
          <div className="ap-msg">What would you like to do?</div>
          <div className="ap-opts">
            <button className="ap-opt" onClick={() => { showVoicePage(); onToggle(); }}>
              Plan a trip by voice
            </button>
            <button className="ap-opt" onClick={() => { showPlanner(); onToggle(); }}>
              Open the AI Planner
            </button>
            <button className="ap-opt" onClick={() => { showExperience(); onToggle(); }}>
              Try the Experience Center
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
