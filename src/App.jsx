import React, { useEffect, useMemo, useState } from 'react';
import {
  electrodeNodes,
  liveFrames,
  patientProfile,
  quickNeeds,
  readinessChecklist,
  reviewSnapshot,
  savedPhrases,
  signalChain
} from './mockData.js';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'setup', label: 'Setup' },
  { id: 'live', label: 'Live Decode' },
  { id: 'review', label: 'Review' }
];

const stateMeta = {
  warning: { label: 'Watch carefully', tone: 'warning', pillClass: 'pill-warning' },
  stabilizing: { label: 'Improving', tone: 'stabilizing', pillClass: 'pill-info' },
  ready: { label: 'Ready', tone: 'ready', pillClass: 'pill-success' },
  confirmed: { label: 'Confirmed', tone: 'confirmed', pillClass: 'pill-success' }
};

function titleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function tokenisePhrase(phrase) {
  return phrase.toLowerCase().split(' ').filter(Boolean);
}

function buildPhrase(tokens) {
  return titleCase(tokens.join(' ').trim());
}

function App() {
  const [role, setRole] = useState('operator');
  const [activeTab, setActiveTab] = useState('overview');
  const [liveIndex, setLiveIndex] = useState(0);
  const [selectedTokens, setSelectedTokens] = useState(tokenisePhrase('I need water'));
  const [messageHistory, setMessageHistory] = useState(reviewSnapshot.recentMessages);
  
  const liveFrame = liveFrames[liveIndex];
  const currentState = stateMeta[liveFrame.systemState];
  const currentPhrase = buildPhrase(selectedTokens);

  useEffect(() => {
    if (activeTab !== 'live') return;
    const timer = window.setInterval(() => {
      setLiveIndex((current) => (current + 1) % liveFrames.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  function handleAddToken(token) {
    setSelectedTokens((current) => [...current, token.toLowerCase()]);
  }

  function handleUseCandidate(candidate) {
    setSelectedTokens([candidate.toLowerCase()]);
  }

  function handleUsePhrase(phrase) {
    setSelectedTokens(tokenisePhrase(phrase));
  }

  function handleClearPhrase() {
    setSelectedTokens([]);
  }

  function handleConfirmPhrase() {
    if (!currentPhrase) return;
    const nextMessage = {
      id: `msg-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: currentPhrase,
      confidence: liveFrame.candidates[0].confidence,
      state: liveFrame.systemState
    };
    setMessageHistory((current) => [nextMessage, ...current]);
    setActiveTab('review');
  }

  return (
    <div className="app-shell">
      <div className="ambient-bg">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
      </div>

      <Navbar 
        role={role} 
        setRole={setRole} 
        currentState={currentState} 
      />

      {role === 'patient' ? (
        <PatientSurface currentPhrase={currentPhrase} liveFrame={liveFrame} onUsePhrase={handleUsePhrase} />
      ) : (
        <div className="main-layout">
          <aside className="sidebar">
            <div className="patient-card">
              <span className="label">Active Patient</span>
              <h2>{patientProfile.name}</h2>
              <p style={{ color: 'var(--slate-400)', fontSize: '0.875rem', margin: '4px 0 0' }}>
                {patientProfile.diagnosis} • {patientProfile.age}y
              </p>
            </div>

            <nav className="nav-menu">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="card" style={{ marginTop: 'auto', padding: 'var(--space-4)' }}>
              <span className="label" style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>System Status</span>
              <div className={`status-pill ${currentState.pillClass}`} style={{ marginTop: 'var(--space-2)' }}>
                {currentState.label}
              </div>
            </div>
          </aside>

          <main className="content-area">
            {activeTab === 'overview' && <OverviewView lastConfirmed={messageHistory[0]} liveFrame={liveFrame} />}
            {activeTab === 'setup' && <SetupView liveFrame={liveFrame} />}
            {activeTab === 'live' && (
              <LiveView 
                liveFrame={liveFrame} 
                currentPhrase={currentPhrase} 
                onAddToken={handleAddToken}
                onClearPhrase={handleClearPhrase}
                onConfirmPhrase={handleConfirmPhrase}
                onUseCandidate={handleUseCandidate}
              />
            )}
            {activeTab === 'review' && <ReviewView messages={messageHistory} />}
          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}

function Navbar({ role, setRole, currentState }) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="logo-icon">L</div>
        <div>
          <h1>Linya EEG Communicator</h1>
          <div style={{ fontSize: '0.65rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
            DOH Philippines • Research Prototype
          </div>
        </div>
      </div>
      
      <div className="nav-actions">
        <div className={`status-pill ${currentState.pillClass}`}>
          {currentState.label}
        </div>
        <div className="mode-switch" style={{ display: 'flex', background: 'var(--slate-100)', padding: '4px', borderRadius: '999px' }}>
          <button 
            className={`btn btn-ghost ${role === 'operator' ? 'active' : ''}`}
            style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '0.875rem', background: role === 'operator' ? 'white' : 'transparent', boxShadow: role === 'operator' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => setRole('operator')}
          >
            Operator
          </button>
          <button 
            className={`btn btn-ghost ${role === 'patient' ? 'active' : ''}`}
            style={{ borderRadius: '999px', padding: '6px 16px', fontSize: '0.875rem', background: role === 'patient' ? 'white' : 'transparent', boxShadow: role === 'patient' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => setRole('patient')}
          >
            Patient
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>© 2026 Linya Research • Optimized for DOH Public Hospitals • V0.4.2</div>
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <span style={{ fontWeight: '600' }}>Distortion-Aware Core Active</span>
        <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>View Paper</span>
        <span style={{ cursor: 'pointer' }}>Support</span>
      </div>
    </footer>
  );
}

function OverviewView({ lastConfirmed, liveFrame }) {
  return (
    <div className="view-container">
      <div className="card" style={{ marginBottom: 'var(--space-6)', background: 'linear-gradient(135deg, var(--slate-950), #0f172a)', color: 'white', border: 'none', padding: 'var(--space-8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="label" style={{ color: 'var(--primary-light)' }}>Proprietary Technology</span>
            <h2 style={{ color: 'white', fontSize: '2rem', marginTop: 'var(--space-2)' }}>Distortion-Aware Intelligence</h2>
            <p style={{ color: 'var(--slate-400)', maxWidth: '600px', marginTop: 'var(--space-2)', fontSize: '1rem' }}>
              Advanced neural processing that reconstructs speech intent directly through skull-induced signal degradation.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <button className="btn btn-primary" style={{ background: 'var(--primary-light)', border: 'none' }}>System Manual</button>
          </div>
        </div>
      </div>

      <div className="metrics-row">
        <StatCard label="Live Readiness" value={`${liveFrame.readiness}%`} note="System Stability" />
        <StatCard label="Selections / Min" value="5.2" note="Communication Speed" />
        <StatCard label="Active Mode" value="Subject-Independent" note="No Calibration Required" />
      </div>

      <div className="grid-2">
        <section className="card">
          <h3 className="card-title">Patient Profile</h3>
          <p className="card-subtitle">Current bedside session context</p>
          <div className="data-list">
            <DataRow label="Patient Name" value={patientProfile.name} />
            <DataRow label="Clinical Site" value="DOH Partner Hospital" />
            <DataRow label="Primary Diagnosis" value={patientProfile.diagnosis} />
            <DataRow label="Fatigue Threshold" value={`${patientProfile.fatigueWindowMin} min`} />
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Processing Pipeline</h3>
          <p className="card-subtitle">Active distortion-compensation layers</p>
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-100)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-500)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Real-time Signal Reconstruction</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-100)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-500)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Adaptive Artifact Suppression</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-100)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-500)' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Cross-Subject Word Prediction</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SetupView({ liveFrame }) {
  return (
    <div className="view-container">
      <div className="grid-2">
        <section className="card">
          <h3 className="card-title">System Readiness</h3>
          <div style={{ textAlign: 'center', margin: 'var(--space-6) 0' }}>
            <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>{liveFrame.readiness}%</div>
            <div style={{ color: 'var(--slate-500)', fontWeight: '500' }}>Overall Stability</div>
          </div>
          <div className="data-list">
            {readinessChecklist.map((item) => (
              <div key={item.title} className="data-row">
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{item.detail}</div>
                </div>
                <div className={`status-pill ${item.status === 'ready' ? 'pill-success' : 'pill-warning'}`} style={{ transform: 'scale(0.8)' }}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Electrode Map</h3>
          <p className="card-subtitle">Channel quality visualization</p>
          <div style={{ height: '300px', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: '20px', border: '2px dashed var(--slate-200)', borderRadius: '50%' }} />
            {electrodeNodes.map((node) => (
              <div key={node.id} style={{ 
                position: 'absolute', 
                left: `${node.x}%`, 
                top: `${node.y}%`,
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: node.quality === 'good' ? 'var(--emerald-500)' : node.quality === 'warning' ? 'var(--amber-500)' : 'var(--red-500)',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 3px white',
                zIndex: 2
              }} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LiveView({ liveFrame, currentPhrase, onAddToken, onClearPhrase, onConfirmPhrase, onUseCandidate }) {
  return (
    <div className="view-container">
      <section className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 className="card-title">Phrase Composer</h3>
        <div style={{ 
          padding: 'var(--space-6)', 
          background: 'var(--slate-950)', 
          color: 'white', 
          borderRadius: 'var(--radius-md)',
          fontSize: '2rem',
          fontWeight: '600',
          fontFamily: 'var(--font-heading)',
          minHeight: '120px',
          display: 'flex',
          alignItems: 'center'
        }}>
          {currentPhrase || 'Listening...'}
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <button className="btn btn-primary" onClick={onConfirmPhrase}>Confirm with Caregiver</button>
          <button className="btn" onClick={() => onAddToken('please')}>Add "please"</button>
          <button className="btn" onClick={() => onAddToken('now')}>Add "now"</button>
          <button className="btn" onClick={onClearPhrase}>Clear</button>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h3 className="card-title">Live Candidates</h3>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {liveFrame.candidates.map((c) => (
              <button 
                key={c.label} 
                className="btn btn-ghost"
                style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4)', textAlign: 'left', height: 'auto' }}
                onClick={() => onUseCandidate(c.label)}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>{c.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'normal' }}>{c.detail}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '1.25rem' }}>{Math.round(c.confidence * 100)}%</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Match</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {quickNeeds.map(need => (
              <button 
                key={need} 
                className="btn btn-ghost" 
                style={{ textAlign: 'left', padding: 'var(--space-3)', background: 'var(--slate-50)' }}
                onClick={() => onUseCandidate(need)}
              >
                {need}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewView({ messages }) {
  return (
    <div className="view-container">
      <section className="card">
        <h3 className="card-title">Message History</h3>
        <p className="card-subtitle">Recent communication events</p>
        <div className="data-list">
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--slate-400)' }}>No messages logged yet.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="data-row" style={{ padding: 'var(--space-4) 0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>"{m.text}"</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    {m.time} • {Math.round(m.confidence * 100)}% confidence
                  </div>
                </div>
                <div className={`status-pill ${stateMeta[m.state]?.pillClass || 'pill-success'}`}>
                  {stateMeta[m.state]?.label || 'Logged'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function PatientSurface({ currentPhrase, liveFrame, onUsePhrase }) {
  return (
    <div className="main-layout" style={{ justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: '900px', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <span className="label" style={{ color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Patient Dashboard</span>
          <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', margin: 'var(--space-8) 0', lineHeight: 1.1 }}>{currentPhrase || 'Listening...'}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)' }}>
             <div className={`status-pill ${stateMeta[liveFrame.systemState].pillClass}`} style={{ padding: '8px 20px', fontSize: '1rem' }}>
               {stateMeta[liveFrame.systemState].label}
             </div>
          </div>
        </div>

        <div className="grid-2">
           {savedPhrases.slice(0, 4).map(phrase => (
             <button 
              key={phrase} 
              className="card btn-ghost" 
              style={{ padding: 'var(--space-6)', fontSize: '1.25rem', fontWeight: '600', textAlign: 'left' }}
              onClick={() => onUsePhrase(phrase)}
             >
               {phrase}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div className="card stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-note">{note}</span>
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="data-row">
      <span className="data-label">{label}</span>
      <span className="data-value">{value}</span>
    </div>
  );
}

export default App;
