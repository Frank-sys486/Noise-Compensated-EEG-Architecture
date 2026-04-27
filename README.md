# Linya EEG Communicator

Mock UI prototype for a non-invasive EEG speech decoding workflow based on the paper:

`3 noise/Noise-Compensated EEG Architecture for Non-Invasive Speech Decoding in Non-Verbal Patients Using Distortion-Aware Deep Learning.pdf`

## What is included

- operator-facing dashboard with four views: overview, setup, live decode, and review
- patient-facing communication surface
- mock signal quality, artifact, and decoder confidence states
- phrase composer and caregiver confirmation flow

## Run locally

```bash
npm install
npm run dev
```

## Project structure

- `src/App.jsx` - main prototype
- `src/mockData.js` - mock session, live decode frames, and review metrics
- `src/styles.css` - visual system and layout

