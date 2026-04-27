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
  warning: { label: 'Watch carefully', tone: 'warning' },
  stabilizing: { label: 'Improving', tone: 'stabilizing' },
  ready: { label: 'Ready for phrase capture', tone: 'ready' },
  confirmed: { label: 'Confirmed', tone: 'confirmed' }
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
  const [throughput, setThroughput] = useState(Number(reviewSnapshot.metrics[0].value));
  const [topConfidence, setTopConfidence] = useState(89);

  const liveFrame = liveFrames[liveIndex];
  const currentState = stateMeta[liveFrame.systemState];
  const currentPhrase = buildPhrase(selectedTokens);
  const readinessScore = liveFrame.readiness;

  useEffect(() => {
    if (activeTab !== 'live') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLiveIndex((current) => (current + 1) % liveFrames.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [activeTab]);

  const reviewMetrics = useMemo(() => {
    return reviewSnapshot.metrics.map((metric) => {
      if (metric.label === 'Selections / min') {
        return { ...metric, value: throughput.toFixed(1) };
      }

      if (metric.label === 'Top confidence') {
        return { ...metric, value: `${topConfidence}%` };
      }

      return metric;
    });
  }, [throughput, topConfidence]);

  const lastConfirmed = messageHistory[0];

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
    if (!currentPhrase) {
      return;
    }

    const nextConfidence = Math.round(liveFrame.candidates[0].confidence * 100);
    const nextMessage = {
      id: `msg-${Date.now()}`,
      time: '09:18',
      text: currentPhrase,
      confidence: liveFrame.candidates[0].confidence,
      state: liveFrame.systemState
    };

    setMessageHistory((current) => [nextMessage, ...current]);
    setThroughput((current) => Number((current + 0.4).toFixed(1)));
    setTopConfidence((current) => Math.max(current, nextConfidence));
    setActiveTab('review');
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <div className="frame">
        <header className="topbar">
          <div>
            <div className="eyebrow">Non-invasive speech decoding prototype</div>
            <div className="brand-row">
              <div className="brand-mark">L</div>
              <div>
                <h1>Linya EEG Communicator</h1>
                <p>Distortion-aware communication workflow for non-verbal patients</p>
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <div className={`status-pill tone-${currentState.tone}`}>
              <span className="status-dot" />
              {currentState.label}
            </div>
            <div className="mode-switch">
              <button
                className={role === 'operator' ? 'active' : ''}
                onClick={() => setRole('operator')}
              >
                Operator
              </button>
              <button
                className={role === 'patient' ? 'active' : ''}
                onClick={() => setRole('patient')}
              >
                Patient
              </button>
            </div>
          </div>
        </header>

        {role === 'patient' ? (
          <PatientSurface
            currentPhrase={currentPhrase}
            liveFrame={liveFrame}
            onUsePhrase={handleUsePhrase}
            lastConfirmed={lastConfirmed}
          />
        ) : (
          <div className="workspace">
            <aside className="sidebar">
              <div className="sidebar-card">
                <span className="section-label">Active session</span>
                <h2>{patientProfile.name}</h2>
                <p>
                  {patientProfile.diagnosis} • {patientProfile.site}
                </p>
              </div>

              <nav className="nav-list">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="sidebar-note">
                <span className="section-label">Clinical target</span>
                <p>
                  Keep setup below {patientProfile.fatigueWindowMin} minutes and keep low-confidence
                  output inside caregiver confirmation loops.
                </p>
              </div>
            </aside>

            <main className="page">
              {activeTab === 'overview' && (
                <OverviewView
                  readinessScore={readinessScore}
                  currentState={currentState}
                  lastConfirmed={lastConfirmed}
                />
              )}

              {activeTab === 'setup' && <SetupView liveFrame={liveFrame} />}

              {activeTab === 'live' && (
                <LiveView
                  currentPhrase={currentPhrase}
                  liveFrame={liveFrame}
                  onAddToken={handleAddToken}
                  onClearPhrase={handleClearPhrase}
                  onConfirmPhrase={handleConfirmPhrase}
                  onUseCandidate={handleUseCandidate}
                  onUsePhrase={handleUsePhrase}
                />
              )}

              {activeTab === 'review' && (
                <ReviewView metrics={reviewMetrics} messages={messageHistory} topConfidence={topConfidence} />
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewView({ readinessScore, currentState, lastConfirmed }) {
  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="section-label">Product framing</span>
          <h2>Design for trust, not just prediction.</h2>
          <p className="hero-copy">
            The paper is about signal recovery and clinically usable communication, so the UI makes
            signal quality, confidence, and caregiver confirmation visible at every step.
          </p>
        </div>

        <div className="hero-metrics">
          <MetricCard label="Readiness" value={`${readinessScore}%`} note="Live session confidence gate" />
          <MetricCard
            label="Last message"
            value={lastConfirmed?.text ?? patientProfile.lastMessage}
            note={`${lastConfirmed?.time ?? patientProfile.lastMessageTime} • caregiver confirmed`}
            compact
          />
          <MetricCard
            label="Session mode"
            value="Subject-independent"
            note={currentState.label}
          />
        </div>
      </section>

      <section className="grid-two">
        <Panel title="Patient Snapshot" subtitle="Bedside context for this mock">
          <div className="list-stack">
            <InlineMetric label="Patient" value={`${patientProfile.name}, ${patientProfile.age}`} />
            <InlineMetric label="Diagnosis" value={patientProfile.diagnosis} />
            <InlineMetric label="Preferred language" value={patientProfile.preferredLanguage} />
            <InlineMetric label="Fatigue window" value={`${patientProfile.fatigueWindowMin} min`} />
          </div>
        </Panel>

        <Panel title="Signal Chain" subtitle="Grounded in the paper's architecture">
          <div className="chain-grid">
            {signalChain.map((step) => (
              <div key={step.title} className="chain-step">
                <strong>{step.title}</strong>
                <span>{step.detail}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid-two">
        <Panel title="Why This Mock Matters" subtitle="Product implications from the research">
          <ul className="flat-list">
            <li>Skull distortion and artifacts must be visible, not hidden behind a fake certainty score.</li>
            <li>Short, fatigue-aware setup is a primary UX constraint, not a secondary optimization.</li>
            <li>The output needs a bedside confirmation loop before it becomes actionable.</li>
          </ul>
        </Panel>

        <Panel title="Deployment Lens" subtitle="Built for public-hospital realism">
          <ul className="flat-list">
            <li>Bright-room, high-contrast interface with calm motion and large targets.</li>
            <li>Operator and patient surfaces are separate because their cognitive load is different.</li>
            <li>Review metrics emphasize communication utility, not only model performance.</li>
          </ul>
        </Panel>
      </section>
    </div>
  );
}

function SetupView({ liveFrame }) {
  return (
    <div className="page-grid">
      <section className="grid-two">
        <Panel title="Session Readiness" subtitle="Translate preprocessing into plain language">
          <div className="score-ring">
            <div className="score-ring-inner">
              <strong>{liveFrame.readiness}%</strong>
              <span>Ready</span>
            </div>
          </div>

          <div className="list-stack">
            {readinessChecklist.map((item) => (
              <div key={item.title} className={`check-row tone-${item.status}`}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <b>{item.status}</b>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Electrode Health Map" subtitle="Channel quality before decode">
          <div className="electrode-shell">
            {electrodeNodes.map((node) => (
              <div
                key={node.id}
                className={`electrode-node quality-${node.quality}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span>{node.id}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid-two">
        <Panel title="Artifact Watch" subtitle="Noise is a first-class design concern">
          <div className="artifact-list">
            {liveFrame.artifactFlags.map((flag) => (
              <div key={flag} className="artifact-chip">
                {flag}
              </div>
            ))}
          </div>
          <p className="panel-copy">{liveFrame.summary}</p>
        </Panel>

        <Panel title="Calibration Window" subtitle="Low-burden setup is part of the thesis">
          <div className="meter-card">
            <div className="meter-head">
              <span>Progress</span>
              <strong>{liveFrame.setupProgress}%</strong>
            </div>
            <div className="meter-track">
              <div className="meter-fill" style={{ width: `${liveFrame.setupProgress}%` }} />
            </div>
          </div>
          <div className="list-stack">
            <InlineMetric label="Mode" value="Subject-independent profile loaded" />
            <InlineMetric label="Target" value={`Stay below ${patientProfile.fatigueWindowMin} min session prep`} />
            <InlineMetric label="Operator note" value="Proceed to live decode once blinking settles." />
          </div>
        </Panel>
      </section>
    </div>
  );
}

function LiveView({
  currentPhrase,
  liveFrame,
  onAddToken,
  onClearPhrase,
  onConfirmPhrase,
  onUseCandidate,
  onUsePhrase
}) {
  return (
    <div className="page-grid">
      <section className="grid-two live-grid">
        <Panel title="Live Decode" subtitle="Confidence is shown as ranked evidence">
          <div className="signal-bars">
            {liveFrame.signalBars.map((height, index) => (
              <div key={`${liveFrame.id}-${index}`} className="signal-bar">
                <span style={{ height: `${height}%` }} />
              </div>
            ))}
          </div>

          <div className="candidate-list">
            {liveFrame.candidates.map((candidate) => (
              <button
                key={candidate.label}
                className="candidate-card"
                onClick={() => onUseCandidate(candidate.label)}
              >
                <div>
                  <strong>{candidate.label}</strong>
                  <p>{candidate.detail}</p>
                </div>
                <div className="confidence-block">
                  <span>{Math.round(candidate.confidence * 100)}%</span>
                  <small>confidence</small>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Session Trust Panel" subtitle="Explain why the model should or should not be trusted">
          <div className="trust-card">
            <div className={`status-pill tone-${stateMeta[liveFrame.systemState].tone}`}>
              <span className="status-dot" />
              {stateMeta[liveFrame.systemState].label}
            </div>
            <p>{liveFrame.trustNote}</p>
          </div>

          <div className="artifact-list">
            {liveFrame.artifactFlags.map((flag) => (
              <div key={flag} className="artifact-chip">
                {flag}
              </div>
            ))}
          </div>

          <p className="panel-copy">{liveFrame.summary}</p>
        </Panel>
      </section>

      <section className="grid-two live-grid">
        <Panel title="Phrase Composer" subtitle="Bridge uncertain tokens into meaningful bedside language">
          <div className="phrase-card">
            <span className="phrase-label">Active phrase</span>
            <div className="phrase-value">{currentPhrase || 'Select a candidate or a quick need'}</div>
          </div>

          <div className="action-row">
            <button className="action-button ghost" onClick={() => onAddToken('please')}>
              Add "please"
            </button>
            <button className="action-button ghost" onClick={() => onAddToken('now')}>
              Add "now"
            </button>
            <button className="action-button ghost" onClick={onClearPhrase}>
              Clear
            </button>
          </div>

          <div className="action-row">
            <button className="action-button primary" onClick={onConfirmPhrase}>
              Confirm with caregiver
            </button>
          </div>
        </Panel>

        <Panel title="Quick Needs" subtitle="Fast bedside phrases for common requests">
          <div className="quick-grid">
            {quickNeeds.map((need) => (
              <button key={need} className="need-tile" onClick={() => onUseCandidate(need)}>
                {need}
              </button>
            ))}
          </div>

          <div className="saved-phrases">
            {savedPhrases.map((phrase) => (
              <button key={phrase} className="saved-phrase" onClick={() => onUsePhrase(phrase)}>
                {phrase}
              </button>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function ReviewView({ metrics, messages, topConfidence }) {
  return (
    <div className="page-grid">
      <section className="metrics-row">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} note={metric.note} />
        ))}
      </section>

      <section className="grid-two">
        <Panel title="Benchmark Snapshot" subtitle="How the mock frames value">
          <div className="benchmark-list">
            {reviewSnapshot.benchmark.map((item) => (
              <div key={item.label} className="benchmark-row">
                <div className="benchmark-head">
                  <strong>{item.label}</strong>
                  <span>{item.value}%</span>
                </div>
                <div className="meter-track">
                  <div
                    className={`meter-fill ${item.value === topConfidence ? 'accent' : ''}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Session Notes" subtitle="Clinical and research framing">
          <ul className="flat-list">
            {reviewSnapshot.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Panel>
      </section>

      <section>
        <Panel title="Message Log" subtitle="Recent communication events">
          <div className="message-log">
            {messages.map((message) => (
              <div key={message.id} className="message-row">
                <div>
                  <strong>{message.text}</strong>
                  <p>
                    {message.time} • {Math.round(message.confidence * 100)}% confidence
                  </p>
                </div>
                <div className={`status-pill tone-${stateMeta[message.state]?.tone ?? 'ready'}`}>
                  <span className="status-dot" />
                  {stateMeta[message.state]?.label ?? 'Logged'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function PatientSurface({ currentPhrase, liveFrame, onUsePhrase, lastConfirmed }) {
  return (
    <main className="patient-surface">
      <section className="patient-hero">
        <div className="patient-copy">
          <span className="section-label">Patient communication surface</span>
          <h2>{currentPhrase || 'Your message will appear here'}</h2>
          <p>
            Large, calm, confirmable output for bedside use. This view strips away research
            complexity and leaves only what the patient and caregiver need in the moment.
          </p>
        </div>

        <div className="patient-status">
          <div className={`status-pill tone-${stateMeta[liveFrame.systemState].tone}`}>
            <span className="status-dot" />
            {stateMeta[liveFrame.systemState].label}
          </div>
          <strong>{Math.round(liveFrame.candidates[0].confidence * 100)}% top confidence</strong>
          <span>Caregiver confirmation remains required before message dispatch.</span>
        </div>
      </section>

      <section className="patient-grid">
        {savedPhrases.slice(0, 4).map((phrase) => (
          <button key={phrase} className="patient-tile" onClick={() => onUsePhrase(phrase)}>
            {phrase}
          </button>
        ))}
      </section>

      <section className="patient-footer">
        <div>
          <span className="section-label">Last confirmed</span>
          <strong>{lastConfirmed?.text ?? patientProfile.lastMessage}</strong>
        </div>
        <div>
          <span className="section-label">Time</span>
          <strong>{lastConfirmed?.time ?? patientProfile.lastMessageTime}</strong>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, note, compact = false }) {
  return (
    <div className={compact ? 'metric-card compact' : 'metric-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function InlineMetric({ label, value }) {
  return (
    <div className="inline-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default App;
