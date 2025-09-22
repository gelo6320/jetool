# Wealth Analyzer Dashboard

A Next.js application integrated with Python AI agent for analyzing wealth and economic status of public figures.

## Features

- **AI-Powered Analysis**: Uses OpenAI GPT models to analyze wealth indicators
- **Image Analysis**: Optional image upload for lifestyle analysis
- **Real-time Results**: Live analysis with confidence scores and detailed explanations
- **Modern UI**: Clean, responsive interface built with React and TypeScript

## Setup

### Prerequisites

- Node.js 18+
- Python 3.8+
- OpenAI API Key

### Installation

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Install Python dependencies:**
```bash
cd python
pip install -r requirements.txt
cd ..
```

3. **Set up environment variables:**

Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Run the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How it Works

### Architecture

1. **Frontend (Next.js/React)**: User interface for input and results display
2. **API Routes (Next.js)**: RESTful endpoints that handle HTTP requests
3. **Python Agent**: AI-powered analysis using OpenAI GPT models via subprocess calls

### Analysis Process

1. User enters a name and optionally uploads an image
2. Frontend converts image to base64 and sends POST request to `/api/analyze`
3. API route spawns Python subprocess with the analysis parameters
4. Python agent performs web search and image analysis using OpenAI API
5. Results are returned as JSON and displayed in the frontend

### Data Flow

```
User Input → Next.js API Route → Python Subprocess → OpenAI API → Analysis Results → Frontend Display
```

## API Endpoints

### POST `/api/analyze`

Analyzes wealth of a person based on name and optional image.

**Request Body:**
```json
{
  "firstName": "Elon",
  "lastName": "Musk",
  "imageBase64": "base64_encoded_image_data" // optional
}
```

**Response:**
```json
{
  "persona": "Elon Musk",
  "risultato_finale": {
    "punteggio_finale": 95,
    "categoria": "molto_ricco",
    "spiegazione": "Detailed analysis...",
    "confidenza": 0.92,
    "fattori_principali": ["CEO Tesla", "SpaceX Founder"]
  },
  "analisi_immagine": { /* if image provided */ }
}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
