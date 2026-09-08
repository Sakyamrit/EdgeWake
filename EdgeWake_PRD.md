# Product Requirements Document: EdgeWake

**Ultra-Low-Latency, Privacy-Preserving Voice Activator for Edge Devices**

| | |
|---|---|
| **Status** | Draft — MVP |
| **Owner(s)** | Firmware/ML lead, Backend lead, UI/UX lead |
| **Document version** | 0.1 |

---

## 1. Overview

EdgeWake is a wake-word ("hotword") activated voice interface built on the ESP32-S3. The device listens continuously for a custom keyword entirely on-device using a TinyML keyword-spotting (KWS) model. No audio leaves the device before the wake word is detected. Once detected, the device streams raw PCM audio over a local Wi-Fi WebSocket connection to a laptop/server running an open-source Automatic Speech Recognition (ASR) engine, which returns a transcript.

The project's core claims — **privacy** (nothing streamed pre-activation), **low latency** (streaming, not file upload), and **TinyML efficiency** (<256KB RAM footprint) — are demonstrated live via a companion web dashboard that surfaces real-time device state, confidence scores, resource usage, and end-to-end latency breakdowns.

### 1.1 Problem statement

Commercial voice assistants (Alexa, Google Assistant) require cloud connectivity and continuous audio transmission, raising privacy concerns and introducing network-dependent latency. EdgeWake demonstrates that wake-word detection can run entirely on a low-cost microcontroller, decoupling "always listening" from "always transmitting," while keeping end-to-end response latency competitive.

### 1.2 Goals

- Detect a custom wake word on-device with high true-positive rate and low false-activation rate, within strict RAM/CPU budgets.
- Guarantee zero audio transmission prior to wake-word detection (privacy gate).
- Stream detected-speech audio to a local ASR server with minimal added latency (no file save/upload round trip).
- Present a live dashboard that makes the technical proof (state, confidence, latency, memory) legible within five seconds of observation.
- Produce a defensible, measured evidence table (target vs. achieved) rather than qualitative claims.

### 1.3 Non-goals (MVP)

- Cloud ASR / paid transcription services.
- OLED display, battery/portable power, charging circuit, enclosure, PCB.
- Multi-language or multiple simultaneous wake words.
- Partial/streaming transcription (live word-by-word transcript).
- Voice-command action execution (e.g., actually turning on smart-home lights).
- Mobile app.
- OTA firmware updates (a "Deploy/OTA" UI affordance may exist for demo purposes but is not a hard MVP requirement).

These are explicitly deferred to a post-MVP phase and should not block the core demo.

### 1.4 Target users / audience

- **Primary:** Hackathon/SIH judges evaluating technical feasibility, privacy design, and measured performance.
- **Secondary:** The project team itself, using the dashboard as a debugging/validation tool during development.
- **Tertiary (future):** End users of a productized on-device voice assistant.

---

## 2. System Architecture

```
┌─────────────────────┐
│     MICROPHONE       │  INMP441 (I2S MEMS)
└──────────┬───────────┘
           ↓
┌─────────────────────┐
│  Audio Preprocess    │  16 kHz / 16-bit mono, DMA-driven I2S capture
└──────────┬───────────┘
           ↓
┌─────────────────────┐
│  Feature Extraction  │  MFCC / Log-Mel (ESP-DSP)
└──────────┬───────────┘
           ↓
┌─────────────────────┐
│  TinyML KWS Model    │  INT8 quantized CNN, <256 KB RAM, on ESP32-S3
└──────────┬───────────┘
           ↓
     Keyword detected?
      /            \
    NO              YES
     ↓               ↓
Keep listening   Start pre-trigger buffer → open WebSocket
                       ↓
                 Stream PCM chunks (pre-buffer + live)
                       ↓
                    Wi-Fi (local network)
                       ↓
              ┌─────────────────┐
              │   ASR SERVER     │  Python + open-source ASR (Whisper-family)
              │   (laptop)       │
              └────────┬─────────┘
                       ↓
                 Speech → Text
                       ↓
        JSON telemetry ──────────→ Web Dashboard (this repo)
```

**Key architectural decision:** the ESP32 performs only wake-word detection, pre-buffering, and audio streaming. It never performs ASR, and it never writes audio to storage. The server performs ASR only, and never receives audio before wake-word activation. The dashboard receives lightweight JSON telemetry only — never raw audio.

---

## 3. Functional Requirements by Module

### 3.1 Firmware / Edge Device (ESP32-S3 + INMP441)

| ID | Requirement |
|---|---|
| FW-1 | Capture audio via I2S DMA at 16 kHz / 16-bit mono, continuously, without blocking polling. |
| FW-2 | Extract MFCC or Log-Mel features per ~20–30 ms frame (~50% overlap) using ESP-DSP. |
| FW-3 | Run an INT8-quantized TinyML CNN classifying each 1-second window into `wake_word`, `unknown`, `noise`, `silence`. |
| FW-4 | Require 3 consecutive high-confidence positive frames (temporal smoothing) before declaring a wake event, to suppress false activations. |
| FW-5 | Maintain a rolling circular pre-trigger audio buffer (0.5–1 s, ~16 KB at 16kHz/16-bit) so speech preceding the wake word is not lost. |
| FW-6 | On wake detection: open a WebSocket connection, send the pre-buffer immediately, then stream live PCM chunks (20–40 ms each). |
| FW-7 | Never write audio to flash/SD; never transmit audio before a confirmed wake event. |
| FW-8 | Apply a 1–2 second cooldown after each activation before re-arming detection. |
| FW-9 | After streaming/cooldown, return to `listening` state and resume low-power/interrupt-driven capture. |
| FW-10 | Emit telemetry events (see §4) over the same or a secondary lightweight channel: device state, wake confidence, inference time, RAM/flash/CPU usage, Wi-Fi RSSI. |
| FW-11 (stretch) | Enter a low-CPU idle mode between inference cycles using DMA + interrupts rather than continuous polling. |

### 3.2 ML / Keyword-Spotting Model

| ID | Requirement |
|---|---|
| ML-1 | Wake word must be a distinct 2–3 syllable custom phrase (not a common assistant name), e.g. "Nova," "Hi Edge," "EdgeGo." |
| ML-2 | Training dataset: 300–600+ positive wake-word clips from 12–20+ distinct speakers, plus an equal or greater number of `unknown`/`noise`/`silence` negative clips. |
| ML-3 | Negative/noise conditions must include: fan, classroom, conversation, traffic/music, multiple distances, multiple speaking volumes. |
| ML-4 | Training and test speakers must be disjoint (no speaker overlap) to produce realistic accuracy figures. |
| ML-5 | Model input: 1-second audio windows → MFCC/Log-Mel features. Architecture: small CNN (e.g., depthwise-separable conv blocks) → global average pooling → dense → softmax over 4 classes. |
| ML-6 | Model must be fully INT8 quantized (post-training or quantization-aware) and converted to TensorFlow Lite Micro for on-device deployment. |
| ML-7 | Report model size at each stage: FP32 baseline, INT8 quantized, and final flash/tensor-arena footprint. |
| ML-8 | Baseline reference: TFLite Micro `micro_speech` example workflow. |

### 3.3 Backend / ASR Server

| ID | Requirement |
|---|---|
| BE-1 | Accept a WebSocket connection from the ESP32 and receive binary PCM audio chunks in real time. |
| BE-2 | Buffer streamed audio in memory (no disk writes required for MVP); detect end-of-utterance via voice-activity/inactivity, then run ASR. |
| BE-3 | Use a free, open-source, locally-run ASR engine (e.g., a Whisper-family model) — no cloud ASR subscription for MVP. |
| BE-4 | Emit structured JSON telemetry events to the dashboard client (see §4) — never forward raw audio to the browser. |
| BE-5 | Timestamp pipeline stages server-side (T4 receipt, T5 ASR start, T6 transcript available) for latency measurement. |
| BE-6 (stretch) | Support partial/live transcription; not required for MVP (final-only transcript is acceptable). |

### 3.4 Dashboard / UI (this repository — `EdgeWake` React app)

The dashboard is the primary demo-facing artifact and judge-facing evidence surface. It must clearly distinguish **live/real telemetry** from **simulated/demo data**.

| ID | Requirement | Status in current build |
|---|---|---|
| UI-1 | Render one responsive web dashboard with pipeline states: `Listening → Wake detected → Streaming → Transcribing → Complete / Error`. | ✅ Implemented (`PipelineStage` type); `error` state defined but not yet wired to a real error path. |
| UI-2 | Large, unambiguous device-state indicator visible at a glance. | ✅ Implemented in `LiveDashboard.tsx`. |
| UI-3 | Display wake-word keyword and live confidence score. | ✅ Implemented (`LiveMetrics.keyword`, `.confidence`). |
| UI-4 | Display transcript (including partial text if the backend supports it). | ✅ Transcript list implemented; partial-text field not yet present (backend doesn't emit it yet either — consistent with BE-6 being a stretch goal). |
| UI-5 | Display total latency plus a breakdown (inference / network / ASR). | ✅ Implemented (`inferenceLatencyMs`, `networkLatencyMs`, `totalLatencyMs`); ASR-only latency is not currently broken out as its own field. |
| UI-6 | Display RAM, flash, CPU, Wi-Fi signal (RSSI). | ⚠️ Partial — RAM and CPU idle % implemented; **flash usage and Wi-Fi RSSI are missing** from `LiveMetrics` and should be added. |
| UI-7 | Display audio packets streamed. | ❌ Not yet implemented — should be added to `LiveMetrics`/log stream. |
| UI-8 | Display a recent session/event list (log). | ✅ Implemented (`LogEntry[]`, tagged `SYS`/`KWS`/`ASR`/`AUDIO`). |
| UI-9 | Ingest a real-time event stream from the device/backend over the agreed event contract (§4). | ❌ **Not implemented.** Current build is fully simulated (`handleSimulateTrigger()` fakes the pipeline with `setTimeout`s; metrics jitter via `Math.random()`). This is the single largest gap before the dashboard can show real data. |
| UI-10 | Clearly label any simulated/mock data as **"Demo data"** whenever real telemetry is unavailable. | ❌ **Not implemented.** Judges are explicitly called out as likely to notice unlabeled fake live metrics — this should be treated as a launch blocker for the demo, not a nice-to-have. |
| UI-11 | Provide a benchmarks/evidence screen: target-vs-achieved metrics table, and noise-environment accuracy comparison across distances. | ✅ Implemented (`Benchmarks.tsx`) — includes a 6-row telemetry target table and 4 noise environments (Quiet Room, Office Fan, Multiple Speakers, Traffic Bkgd) at 1 m / 3 m, comparing model versions. |
| UI-12 | Provide a hardware configuration view (chipset, DSP core, audio frontend, sample rate, quantization, VAD sensitivity, beamforming toggle). | ✅ Implemented (`Modals.tsx`) — ⚠️ chipset field currently reads "ESP32-S3 / ARM Cortex-M55," which does not match the actual single-chip ESP32-S3 hardware described in the project brief and should be corrected. |
| UI-13 | Support a live microphone capture mode in-browser for local demoing/testing independent of the physical device. | ✅ Implemented (`getUserMedia` + `AnalyserNode` energy-peak trigger in `App.tsx`). |
| UI-14 | Deploy/OTA, security, logs, docs, and audio-settings modals for a polished demo experience. | ✅ Implemented (`Modals.tsx`), simulated. |

---

## 4. Event Contract (Firmware/Backend ↔ Dashboard)

This is the interface the UI team and firmware/backend team must agree on and implement against. The device/server sends lightweight JSON; **binary audio only ever flows ESP32 → ASR server, never to the browser.**

```text
device_state    { state: "listening" | "wake_detected" | "streaming" | "transcribing" | "complete" | "error" }
wake_detected   { confidence: float, inference_ms: int }
stream_started  { packet_count: int }
metrics         { ram_kb: int, flash_kb: int, cpu_pct: float, rssi: int }
asr_partial     { text: string }
asr_final       { text: string, asr_ms: int }
error           { code: string, message: string }
```

**Open work:** the current dashboard has no consumer for this contract (see UI-9). Implementing a WebSocket client in the dashboard that maps these events onto existing state (`PipelineStage`, `LiveMetrics`, `LogEntry`, `TranscriptEntry`) is the top integration priority.

---

## 5. Non-Functional Requirements / Success Metrics

These targets come directly from the project brief and should populate the Benchmarks screen's evidence table.

| Metric | Target | Notes |
|---|---|---|
| RAM used | < 256 KB | Peak memory during inference loop |
| Idle CPU | < 10% | Measured on core 0 |
| Model size | Minimal (report FP32 → INT8 delta) | e.g. ~500 KB FP32 → ~100–150 KB INT8, then further reduced |
| Keyword true-positive rate | ≥ 98% (stretch), realistically report actual measured value | Must use disjoint train/test speakers |
| False activation rate | < 1/day (target) | Normalize over a 72-hour continuous test |
| Detection latency | < 100 ms | Audio buffer to trigger event (T2 − T1) |
| Network startup latency | Report separately (L2 = T4 − T2) | Do not conflate with detection latency |
| End-to-end latency | < 1 s | Wake-word end to transcript available (T6 − T1), including network + ASR |
| Wi-Fi range / accuracy at distance | 1 m and 3 m accuracy, across noise conditions | Do not claim reliable 3–5 m performance until tested |

**Timing/measurement constraint:** device and server clocks are not synchronized by default. Do not subtract cross-device timestamps unless clocks are explicitly synchronized; otherwise report device-side and server-side latency separately.

**Noise robustness test matrix** (already reflected in `Benchmarks.tsx`):

| Environment | Measured at |
|---|---|
| Quiet Room | 1 m, 3 m |
| Office Fan | 1 m, 3 m |
| Multiple Speakers | 1 m, 3 m |
| Traffic Background | 1 m, 3 m |

---

## 6. Bill of Materials (MVP)

| Component | Purpose | Approx. cost (₹) |
|---|---|---|
| ESP32-S3 (SuperMini or dev board) | Edge processor | 425–900 |
| INMP441 I2S MEMS microphone | Digital audio capture | 121–250 |
| Push button, LED, resistor, jumpers, breadboard | Testing/reset/indicator | ~100–200 |

**Total MVP hardware cost:** ~₹650–850 (excluding shipping). The existing team laptop serves as the ASR server and dashboard host — no additional server hardware required.

**Explicitly deferred** (not MVP): OLED display, Li-ion battery + TP4056 charger, enclosure, PCB, cloud ASR subscription.

### 6.1 Wiring (INMP441 → ESP32-S3)

| INMP441 pin | ESP32-S3 pin |
|---|---|
| GND | GND |
| VDD | 3V3 |
| SD | GP32 |
| SCK | GP33 |
| WS | GP25 |
| L/R | GND |

---

## 7. Milestones / Roadmap

| Phase | Days | Focus |
|---|---|---|
| 1 | 1–3 | Basic audio capture (mic → serial output); verify sampling rate, quality, buffer stability |
| 2 | 4–10 | Dataset collection (keyword / negative / silence / noise) + augmentation (noise, volume, pitch, time-shift) |
| 3 | 11–17 | Train KWS model on laptop (MFCC/Log-Mel → CNN); evaluate accuracy/precision/recall/F1/confusion matrix |
| 4 | 18–22 | TinyML conversion: INT8 quantization → TFLite → TFLite Micro → flash to ESP32; measure flash/RAM/inference time/CPU |
| 5 | 23–27 | Real-time on-device KWS with temporal smoothing and wake event firing |
| 6 | 28–32 | Audio streaming: ESP32 → Wi-Fi → WebSocket → Python server, chunked (not file-based) |
| 7 | 33–37 | ASR integration on server; keyword → transcript end-to-end demo |
| 8 | 38–42 | **Dashboard** (this repo's scope): device status, keyword, confidence, RAM/flash/CPU, inference/network/ASR/total latency |
| 9 | 43–50 | Optimization pass: reduce model size/RAM/CPU/latency/false positives while preserving true-positive rate |
| 10 | — | Final benchmark table completion (target vs. achieved) for presentation |

**Sequencing note from the brief:** dashboard work should start in parallel from day one using mock telemetry, but must not delay the harder, higher-risk work — on-device wake-word detection under memory/CPU constraints. The dashboard mock and the event contract (§4) should be agreed early so the two workstreams converge cleanly at integration time.

---

## 8. Demo Script (target experience)

1. Device sits idle, dashboard shows `LISTENING`, confidence/latency fields quiet.
2. A person stands 3–5 m away and says the wake word plus a command (e.g., "Nova, what is the temperature?").
3. Dashboard updates in real time: `WAKE DETECTED` → confidence % and inference ms appear → `STREAMING` with packet count ticking up → `TRANSCRIBING` → final transcript and total latency displayed.
4. RAM/CPU figures remain visible throughout, demonstrating the TinyML footprint claim live rather than as a static slide.

This sequence should take well under the target end-to-end latency and should be reproducible on demand for judges.

---

## 9. Risks & Open Issues

| Risk / Gap | Impact | Mitigation |
|---|---|---|
| Dashboard currently shows only simulated data with no "Demo data" labeling | Judges may perceive fabricated live metrics, undermining credibility | Prioritize UI-10 (labeling) immediately; treat as a blocker independent of full WebSocket integration |
| No WebSocket client exists yet in the dashboard (UI-9) | Cannot show real telemetry even once firmware/backend are ready | Build event-contract consumer (§4) as the top integration task after core KWS + streaming work lands |
| Hardware config modal lists an inaccurate chipset ("ESP32-S3 / ARM Cortex-M55") | Inconsistent technical claims if inspected closely | Correct to reflect actual single-chip ESP32-S3 hardware |
| Missing telemetry fields: flash usage, Wi-Fi RSSI, packet count | Incomplete picture per brief's dashboard requirements | Extend `LiveMetrics` type and wire into `metrics` event handling |
| Cross-device clock skew | Invalid latency figures if timestamps are naively subtracted | Report device-side and server-side latencies separately unless clocks are synchronized |
| Overclaiming 3–5 m range with a low-cost mic before testing | Demo failure risk if distance claim isn't validated | Treat long-range accuracy as a stretch goal; report only measured 1 m/3 m results |
| Speaker overlap between train/test sets | Inflated, unrealistic accuracy figures | Enforce disjoint speaker sets per ML-4 |

---

## 10. Appendix: Reference Architecture Diagram (ML pipeline)

```
Obtains data → Pre-Process → Train model → Evaluate Model → Convert/Deploy
(multi-speaker   (MFCC/Log-Mel   (CNN)         (accuracy/       (TFLite → TFLite
 recordings,      feature                        confusion       Micro → ESP32-S3
 16kHz/16-bit,    conversion,                     matrix)         flash)
 1s samples)      output image
                  [49,40,1])
```

---

*This document should be treated as living — update the "Status in current build" column in §3.4 and the risk table in §9 as integration work closes each gap.*
