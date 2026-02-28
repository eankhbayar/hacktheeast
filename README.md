# hacktheeast

## Project Overview

**Problem:** Kids are spending excessive time doom-scrolling on their devices, leading to passive screen consumption with no mental engagement.

**Solution:** An app that interrupts kids' scrolling sessions with short, educational quizzes — refreshing their brains and turning idle screen time into learning moments. Interruptions are Alarmy-style and cannot be dismissed until the quiz is completed.

**Target Users:** Toddlers to early school-age children (up to ~12 years old), managed by their parents.

## Team Members & Roles

Khuslen Sansar | UI Designer, Pitch Deck
Ankhbayar Enkhtaivan | Developer
Aswad Mohammed Tariq | Developer
Alua Niyazova | Developer
Alikhan Nurgazy | Developer
Almas Bekbolat | UI Designer, Developer

## Setup Instructions

### Mobile App

1. Clone the repo and install dependencies:
   ```bash
   cd mobile
   npm install
   ```
2. Install [Expo Go](https://expo.dev/go) on your phone **or** set up an iOS Simulator / Android Emulator.
3. Start the dev server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `i` / `a` to open in a simulator/emulator.

### Backend

1. Build and start with Docker Compose:
   ```bash
   docker compose build --no-cache backend
   docker compose up
   ```
   The server runs on `http://localhost:3000`. Check health at `GET /health`.

### AI Agent

1. Set up a Python virtual environment:
   ```bash
   cd agent
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Configure `.env` with API keys (see `.env.example`).
3. Run tests:
   ```bash
   pytest
   ```

## Architecture

![Architecture Diagram](mobile/hte2026.drawio.png)

The project is split into three parts:

- **`mobile/`** — React Native (Expo) client app.
- **`backend/`** — Node.js/TypeScript API deployed on AWS EC2 with DynamoDB.
- **`agent/`** — Python AI agent (LangGraph) that generates personalized lessons, videos, and parent reports via MiniMax LLM.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo), TypeScript |
| State Management | React Context API |
| Local Storage | AsyncStorage |
| Backend | Node.js / TypeScript, deployed on AWS EC2 |
| Database | Amazon DynamoDB |
| AI Agent | Python, LangGraph, Bedrock AgentCore |
| LLM | MiniMax M2.5 Highspeed (text), MiniMax T2V-01 (video) |
| Search Enrichment | Exa Search API |
| Storage | Amazon S3 (videos, progress data, cache) |
| Auth | JWT (access + refresh tokens) |
