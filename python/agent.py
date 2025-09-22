import os
import sys
import requests
import base64
from typing import Optional, List, Dict, Any
from openai import OpenAI
import json
import re
from dotenv import load_dotenv

load_dotenv()

class JewishIdentityAnalyzerAgent:
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)
        self.search_model = "gpt-4o-mini-search-preview"
        self.vision_model = "gpt-4o-mini"
        
    def web_search(self, query: str, max_tokens: int = 1500) -> str:
        """Perform web search to gather information about the person's ethnic/religious background"""
        try:
            response = self.client.chat.completions.create(
                model=self.search_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert researcher specialized in searching for public information about people's ethnic, cultural, and religious background. Provide accurate and verifiable information."
                    },
                    {
                        "role": "user",
                        "content": f"Search for detailed information on: {query}. Focus on: ethnic origin, family background, religious affiliation, cultural heritage, immigration history, ancestral roots."
                    }
                ],
                max_tokens=max_tokens
            )

            return response.choices[0].message.content

        except Exception as e:
            return f"Error during web search: {str(e)}"
    
    def encode_image(self, image_path: str) -> str:
        """Encode an image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    
    def analyze_ethnic_image(self, image_path: str = None, image_url: str = None,
                               image_base64: str = None, person_name: str = "") -> Dict[str, Any]:
        """Analyze an image for ethnic/religious background indicators"""
        try:
            content = [
                {
                    "type": "text",
                    "text": f"""Analyze this image of {person_name} to identify potential Jewish ethnic or cultural indicators.
                    Look for: physical features associated with Ashkenazi/Sephardic heritage, traditional Jewish clothing or accessories,
                    religious symbols (Star of David, menorah, tallit), cultural items, Hebrew writing, synagogue attendance indicators.

                    Provide a score from 0-100 based on visible signs of Jewish heritage and a brief explanation of observed elements.
                    Respond in JSON format: {{"punteggio_immagine": 0-100, "indicatori_visivi": ["list", "of", "elements"], "spiegazione": "brief description"}}"""
                }
            ]

            if image_path:
                base64_image = self.encode_image(image_path)
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{base64_image}",
                        "detail": "high"
                    }
                })
            elif image_base64:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}",
                        "detail": "high"
                    }
                })
            elif image_url:
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": image_url,
                        "detail": "high"
                    }
                })
            else:
                return {"errore": "No image provided"}

            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in ethnic and cultural anthropology. Analyze images to identify potential indicators of Jewish heritage and cultural background."
                    },
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                max_tokens=500,
                temperature=0.1
            )
            
            result = response.choices[0].message.content

            # Try to extract JSON from the response
            try:
                # Search for JSON pattern in the response
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    # Fallback: extract score manually
                    score_match = re.search(r'(\d+)', result)
                    score = int(score_match.group(1)) if score_match else 50
                    return {
                        "punteggio_immagine": score,
                        "indicatori_visivi": ["unstructured analysis"],
                        "spiegazione": result[:200]
                    }
            except (json.JSONDecodeError, ValueError):
                return {
                    "punteggio_immagine": 50,
                    "indicatori_visivi": ["analysis error"],
                    "spiegazione": result[:200]
                }

        except Exception as e:
            return {"errore": f"Error in image analysis: {str(e)}"}
    
    def calculate_jewish_probability(self, search_data: str, image_analysis: Dict = None) -> Dict[str, Any]:
        """Calculate the probability that a person is Jewish based on all data"""
        try:
            # Prepare the prompt for final analysis
            analysis_prompt = f"""Analyze the following data about a person and determine the probability (0-100%) that they are Jewish:

SEARCH DATA:
{search_data}

IMAGE ANALYSIS:
{json.dumps(image_analysis, indent=2) if image_analysis else "No image provided"}

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
  "categoria": "molto_bassa/bassa/moderata/alta/molto_alta",
  "indicatori_principali": ["list", "of", "key", "indicators"],
  "spiegazione": "Brief explanation of the probability assessment (max 150 words)",
  "confidenza": 0.0-1.0
}}"""

            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in ethnic and genealogical analysis specialized in identifying Jewish heritage based on names, family history, and cultural indicators."
                    },
                    {
                        "role": "user",
                        "content": analysis_prompt
                    }
                ],
                max_tokens=600,
                temperature=0.1
            )

            result = response.choices[0].message.content

            # Extract JSON from the response
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    parsed_json = json.loads(json_match.group())
                    # Validate that we have the expected keys
                    if "probabilita_percentuale" in parsed_json:
                        return parsed_json
                    else:
                        # Try to find and fix common issues
                        # Look for probability in the raw response
                        prob_match = re.search(r'(\d+)%', result)
                        if prob_match:
                            probability = int(prob_match.group(1))
                        else:
                            prob_match = re.search(r'probability[^\d]*(\d+)', result, re.IGNORECASE)
                            probability = int(prob_match.group(1)) if prob_match else 50

                        return {
                            "probabilita_percentuale": probability,
                            "categoria": "moderata" if probability > 40 else "bassa",
                            "indicatori_principali": ["fallback analysis"],
                            "spiegazione": result[:200],
                            "confidenza": 0.5
                        }
                else:
                    # Fallback: extract probability manually
                    prob_match = re.search(r'(\d+)%', result)
                    if prob_match:
                        probability = int(prob_match.group(1))
                    else:
                        prob_match = re.search(r'probability[^\d]*(\d+)', result, re.IGNORECASE)
                        probability = int(prob_match.group(1)) if prob_match else 50

                    return {
                        "probabilita_percentuale": probability,
                        "categoria": "moderata" if probability > 40 else "bassa",
                        "indicatori_principali": ["unstructured analysis"],
                        "spiegazione": result[:200],
                        "confidenza": 0.5
                    }
            except (json.JSONDecodeError, ValueError, AttributeError) as e:
                # Fallback: extract probability manually from raw response
                prob_match = re.search(r'(\d+)%', result)
                if prob_match:
                    probability = int(prob_match.group(1))
                else:
                    prob_match = re.search(r'probability[^\d]*(\d+)', result, re.IGNORECASE)
                    probability = int(prob_match.group(1)) if prob_match else 50

                return {
                    "probabilita_percentuale": probability,
                    "categoria": "moderata" if probability > 40 else "bassa",
                    "indicatori_principali": ["analysis error fallback"],
                    "spiegazione": result[:200],
                    "confidenza": 0.3
                }

        except Exception as e:
            return {"errore": f"Error calculating score: {str(e)}"}
    
    def analyze_person_jewish_identity(self, nome: str, cognome: str,
                            image_path: str = None, image_url: str = None, image_base64: str = None) -> Dict[str, Any]:
        """Main function to analyze a person's Jewish identity probability"""

        full_name = f"{nome} {cognome}".strip()

        # Step 1: Web search
        search_queries = [
            f"{full_name} ethnic origin Jewish heritage",
            f"{full_name} family background ancestry",
            f"{full_name} religious affiliation cultural background"
        ]

        all_search_data = []
        for query in search_queries:
            data = self.web_search(query)
            all_search_data.append(data)

        combined_search_data = "\n\n".join(all_search_data)

        # Step 2: Image analysis (if provided)
        image_analysis = None
        if image_path or image_url or image_base64:
            image_analysis = self.analyze_ethnic_image(image_path, image_url, image_base64, full_name)

        # Step 3: Calculate final probability
        final_analysis = self.calculate_jewish_probability(combined_search_data, image_analysis)

        # Add additional information
        result = {
            "persona": full_name,
            "timestamp": "2025-09-22",
            "dati_ricerca": combined_search_data[:500] + "..." if len(combined_search_data) > 500 else combined_search_data,
            "analisi_immagine": image_analysis,
            "risultato_finale": final_analysis
        }

        return result

def main():
    """Main function for command-line execution"""
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python agent.py <first_name> <last_name> [image_base64]"}))
        sys.exit(1)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print(json.dumps({"error": "OpenAI API key not found. Set OPENAI_API_KEY environment variable."}))
        sys.exit(1)

    try:
        nome = sys.argv[1]
        cognome = sys.argv[2]
        image_base64 = sys.argv[3] if len(sys.argv) > 3 else None

        agent = JewishIdentityAnalyzerAgent(api_key)
        result = agent.analyze_person_jewish_identity(nome, cognome, image_base64=image_base64)

        # Output JSON result
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()