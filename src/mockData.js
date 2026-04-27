export const patientProfile = {
  id: 'PT-001',
  name: 'Maria Santos',
  age: 47,
  diagnosis: 'ALS',
  preferredLanguage: 'English',
  site: 'DOH Partner Hospital',
  fatigueWindowMin: 20,
  lastMessage: 'I need water',
  lastMessageTime: '09:14'
};

export const signalChain = [
  {
    title: 'Acquire',
    detail: '32-channel EEG cap with bedside-ready session checks'
  },
  {
    title: 'Clean',
    detail: 'ICA isolates blink, muscle, and line-noise artifacts'
  },
  {
    title: 'Compensate',
    detail: 'Distortion-aware spatial filtering attempts to recover speech patterns'
  },
  {
    title: 'Decode',
    detail: 'Subject-independent model predicts phonemes and words for confirmation'
  }
];

export const readinessChecklist = [
  {
    title: 'Electrode contact',
    detail: '29 of 32 channels stable after saline refresh',
    status: 'ready'
  },
  {
    title: 'Artifact quarantine',
    detail: 'Blink suppression active; jaw tension still monitored',
    status: 'warning'
  },
  {
    title: 'Distortion compensation',
    detail: 'Spatial correction layer active on current session profile',
    status: 'ready'
  },
  {
    title: 'Transfer profile',
    detail: 'Subject-independent weights loaded; calibration minimized',
    status: 'ready'
  }
];

export const electrodeNodes = [
  { id: 'Fp1', x: 36, y: 18, quality: 'warning' },
  { id: 'Fp2', x: 64, y: 18, quality: 'good' },
  { id: 'F7', x: 20, y: 36, quality: 'good' },
  { id: 'F3', x: 38, y: 34, quality: 'good' },
  { id: 'Fz', x: 50, y: 30, quality: 'good' },
  { id: 'F4', x: 62, y: 34, quality: 'warning' },
  { id: 'F8', x: 80, y: 36, quality: 'good' },
  { id: 'T7', x: 14, y: 54, quality: 'poor' },
  { id: 'C3', x: 36, y: 50, quality: 'good' },
  { id: 'Cz', x: 50, y: 50, quality: 'good' },
  { id: 'C4', x: 64, y: 50, quality: 'good' },
  { id: 'T8', x: 86, y: 54, quality: 'warning' },
  { id: 'P3', x: 38, y: 68, quality: 'good' },
  { id: 'Pz', x: 50, y: 70, quality: 'good' },
  { id: 'P4', x: 62, y: 68, quality: 'good' },
  { id: 'O1', x: 42, y: 84, quality: 'good' },
  { id: 'O2', x: 58, y: 84, quality: 'good' }
];

export const quickNeeds = [
  'Water',
  'Pain',
  'Reposition',
  'Yes',
  'No',
  'Nurse',
  'Family',
  'Rest'
];

export const savedPhrases = [
  'I need water',
  'Please reposition me',
  'Call my family',
  'I am in pain',
  'I want to rest'
];

export const liveFrames = [
  {
    id: 'frame-1',
    systemState: 'warning',
    readiness: 74,
    setupProgress: 58,
    summary: 'Frontal blink artifacts are suppressing two channels. Output is visible but should be treated as provisional.',
    trustNote: 'The decoder is running, but confirmation should stay caregiver-assisted until blink events settle.',
    artifactFlags: ['Blink burst', 'Jaw tension'],
    signalBars: [28, 44, 36, 58, 42, 61, 46, 52, 40, 65, 48, 57],
    candidates: [
      { label: 'water', confidence: 0.58, detail: 'Likely basic need request' },
      { label: 'help', confidence: 0.41, detail: 'High overlap with blink segment' },
      { label: 'pain', confidence: 0.26, detail: 'Low reliability under current noise' }
    ]
  },
  {
    id: 'frame-2',
    systemState: 'stabilizing',
    readiness: 83,
    setupProgress: 76,
    summary: 'ICA has reduced ocular noise. Distortion compensation is now improving spatial separation across motor-speech regions.',
    trustNote: 'Confidence is climbing. The session is nearing the paper target of low-calibration, clinically usable readiness.',
    artifactFlags: ['Residual jaw tension'],
    signalBars: [26, 32, 40, 68, 64, 72, 58, 70, 66, 74, 52, 61],
    candidates: [
      { label: 'water', confidence: 0.72, detail: 'Consistent across the last three windows' },
      { label: 'nurse', confidence: 0.38, detail: 'Secondary cluster, below confirm threshold' },
      { label: 'pain', confidence: 0.22, detail: 'Low support after cleanup' }
    ]
  },
  {
    id: 'frame-3',
    systemState: 'ready',
    readiness: 91,
    setupProgress: 100,
    summary: 'Channels are stable and distortion compensation is active. The model is operating in subject-independent word mode.',
    trustNote: 'This is the target state for mock demonstrations: high signal stability, visible confidence, and low setup friction.',
    artifactFlags: ['No major artifact'],
    signalBars: [22, 30, 48, 72, 78, 84, 70, 86, 74, 88, 63, 66],
    candidates: [
      { label: 'water', confidence: 0.82, detail: 'High-confidence word hypothesis' },
      { label: 'yes', confidence: 0.34, detail: 'Weak alternative pattern' },
      { label: 'family', confidence: 0.18, detail: 'Below action threshold' }
    ]
  },
  {
    id: 'frame-4',
    systemState: 'confirmed',
    readiness: 93,
    setupProgress: 100,
    summary: 'A stable sequence produced a strong bedside request. The caregiver can confirm and dispatch the message.',
    trustNote: 'The UI should reward this moment with clarity, not theatrics. The outcome is practical communication.',
    artifactFlags: ['No major artifact'],
    signalBars: [24, 34, 45, 74, 82, 90, 75, 88, 79, 92, 68, 70],
    candidates: [
      { label: 'water', confidence: 0.89, detail: 'Best-supported candidate' },
      { label: 'nurse', confidence: 0.27, detail: 'Not actionable on its own' },
      { label: 'rest', confidence: 0.16, detail: 'Below operational threshold' }
    ]
  }
];

export const reviewSnapshot = {
  metrics: [
    {
      label: 'Selections / min',
      value: '5.2',
      note: 'Target metric from communication utility framing'
    },
    {
      label: 'Setup duration',
      value: '8 min',
      note: 'Short enough for fatigue-limited sessions'
    },
    {
      label: 'Signal uptime',
      value: '87%',
      note: 'Recovered after blink-heavy start'
    },
    {
      label: 'Top confidence',
      value: '89%',
      note: 'Peak live decode confidence in current run'
    }
  ],
  benchmark: [
    { label: 'ICA only baseline', value: 56 },
    { label: 'EEGNet without compensation', value: 68 },
    { label: 'Distortion-aware prototype', value: 82 }
  ],
  recentMessages: [
    {
      id: 'msg-1',
      time: '09:14',
      text: 'I need water',
      confidence: 0.89,
      state: 'confirmed'
    },
    {
      id: 'msg-2',
      time: '09:06',
      text: 'Call my family',
      confidence: 0.74,
      state: 'warning'
    }
  ],
  notes: [
    'Session started with ocular interference, but stabilized after electrode adjustment.',
    'Caregiver confirmation remained enabled throughout the session.',
    'Prototype throughput is strong enough for a believable bedside demo.'
  ]
};

