import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

class JewishIdentityAnalyzerAgent {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async webSearch(query: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini-search-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert researcher specialized in searching for public information about people's ethnic, cultural, and religious background. Provide accurate and verifiable information."
          },
          {
            role: "user",
            content: `Search for detailed information on: ${query}. Focus on: ethnic origin, family background, religious affiliation, cultural heritage, immigration history, ancestral roots.`
          }
        ],
        max_tokens: 1500
      });

      return response.choices[0]?.message?.content || "No search results found";
    } catch (error) {
      return `Error during web search: ${error}`;
    }
  }

  async analyzeEthnicImage(imageBase64: string, personName: string): Promise<any> {
    try {
      const content: any[] = [
        {
          type: "text",
          text: `Analyze this image for cultural and ethnic indicators that may suggest Jewish heritage.
Look for: traditional Jewish religious symbols (Star of David, menorah, tallit, tefillin), Hebrew writing or text,
cultural items (kippah, tallit, mezuzah), clothing with Jewish religious significance, synagogue or Jewish community settings,
historical Jewish cultural artifacts.

Focus on visual elements that are clearly identifiable as Jewish cultural or religious symbols.
Provide a score from 0-100 based on visible signs of Jewish cultural/religious elements and a brief explanation of observed elements.
Respond in JSON format: {{"punteggio_immagine": 0-100, "indicatori_visivi": ["list", "of", "elements"], "spiegazione": "brief description"}}`
        }
      ];

      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: "high"
        }
      });

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert in ethnic and cultural anthropology. Analyze images to identify potential indicators of Jewish heritage and cultural background."
          },
          {
            role: "user",
            content
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      });

      const result = response.choices[0]?.message?.content || "";

      // Try to extract JSON from the response
      try {
        const jsonMatch = result.match(/\{.*\}/s);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        // Fallback: extract probability manually
        const probMatch = result.match(/(\d+)%/);
        const probability = probMatch ? parseInt(probMatch[1]) : 50;

        return {
          punteggio_immagine: probability,
          indicatori_visivi: ["unstructured analysis"],
          spiegazione: result.substring(0, 200)
        };
      } catch (_parseError) {
        const probMatch = result.match(/(\d+)%/);
        const probability = probMatch ? parseInt(probMatch[1]) : 50;

        return {
          punteggio_immagine: probability,
          indicatori_visivi: ["analysis error fallback"],
          spiegazione: result.substring(0, 200)
        };
      }
    } catch (error) {
      return { errore: `Error in image analysis: ${error}` };
    }
  }

  async calculateJewishProbability(searchData: string, imageAnalysis: any = null): Promise<any> {
    try {
      const analysisPrompt = `Analyze the following data about a person and determine the probability (0-100%) that they are Jewish:

SEARCH DATA:
${searchData}

IMAGE ANALYSIS:
${imageAnalysis ? JSON.stringify(imageAnalysis, null, 2) : "No image provided"}

EVALUATION CRITERIA:
- 0-20%: Very low probability, no Jewish indicators
- 21-40%: Low probability, minimal Jewish indicators
- 41-60%: Moderate probability, some Jewish indicators present
- 61-80%: High probability, strong Jewish indicators
- 81-100%: Very high probability, clear Jewish heritage/affiliation

Consider factors like: surname origin, given name origin, family history, religious affiliation, cultural background, physical appearance, and other relevant indicators.

Provide ONLY a JSON in the format:
{{
  "probabilita_percentuale": 0-100,
  "categoria": "very_low/low/moderate/high/very_high",
  "indicatori_principali": ["list", "of", "key", "indicators"],
  "spiegazione": "Brief explanation of the probability assessment (max 150 words)",
  "confidenza": 0.0-1.0
}}`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert in ethnic and genealogical analysis specialized in identifying Jewish heritage based on names, family history, and cultural indicators."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.1
      });

      const result = response.choices[0]?.message?.content || "";

      // Extract JSON from the response
      try {
        const jsonMatch = result.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if ("probabilita_percentuale" in parsed) {
            return parsed;
          }
        }
        // Fallback: extract probability manually
        const probMatch = result.match(/(\d+)%/);
        const probability = probMatch ? parseInt(probMatch[1]) : 50;

        return {
          probabilita_percentuale: probability,
          categoria: probability > 40 ? "moderate" : "low",
          indicatori_principali: ["fallback analysis"],
          spiegazione: result.substring(0, 200),
          confidenza: 0.5
        };
      } catch (_parseError) {
        const probMatch = result.match(/(\d+)%/);
        const probability = probMatch ? parseInt(probMatch[1]) : 50;

        return {
          probabilita_percentuale: probability,
          categoria: probability > 40 ? "moderate" : "low",
          indicatori_principali: ["analysis error fallback"],
          spiegazione: result.substring(0, 200),
          confidenza: 0.3
        };
      }
    } catch (error) {
      return { errore: `Error calculating score: ${error}` };
    }
  }

  async analyzePersonJewishIdentity(nome: string, cognome: string, imageBase64?: string): Promise<any> {
    const fullName = `${nome} ${cognome}`.trim();

    // Step 1: Web search
    const searchQueries = [
      `${fullName} ethnic origin Jewish heritage`,
      `${fullName} family background ancestry`,
      `${fullName} religious affiliation cultural background`
    ];

    const allSearchData: string[] = [];
    for (const query of searchQueries) {
      const data = await this.webSearch(query);
      allSearchData.push(data);
    }

    const combinedSearchData = allSearchData.join("\n\n");

    // Step 2: Image analysis (if provided)
    let imageAnalysis = null;
    if (imageBase64) {
      imageAnalysis = await this.analyzeEthnicImage(imageBase64, fullName);
    }

    // Step 3: Calculate final probability
    const finalAnalysis = await this.calculateJewishProbability(combinedSearchData, imageAnalysis);

    // Add additional information
    return {
      persona: fullName,
      timestamp: new Date().toISOString().split('T')[0],
      dati_ricerca: combinedSearchData.length > 500 ? combinedSearchData.substring(0, 500) + "..." : combinedSearchData,
      analisi_immagine: imageAnalysis,
      risultato_finale: finalAnalysis
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, imageBase64 } = await request.json();

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Create agent and analyze
    const agent = new JewishIdentityAnalyzerAgent(apiKey);
    const result = await agent.analyzePersonJewishIdentity(firstName, lastName, imageBase64);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: `Analysis failed: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
