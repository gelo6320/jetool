import os
import sys
import json
from http.server import BaseHTTPRequestHandler
import urllib.parse

# Add the python directory to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
python_dir = os.path.join(current_dir, '..', 'python')
sys.path.insert(0, python_dir)

try:
    from agent import JewishIdentityAnalyzerAgent
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current dir: {current_dir}")
    print(f"Python dir: {python_dir}")
    raise

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            firstName = data.get('firstName', '')
            lastName = data.get('lastName', '')
            imageBase64 = data.get('imageBase64')

            # Validate input
            if not firstName or not lastName:
                self.send_error(400, 'First name and last name are required')
                return

            # Get API key
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                self.send_error(500, 'OpenAI API key not configured')
                return

            # Create agent and analyze
            agent = JewishIdentityAnalyzerAgent(api_key)

            # Prepare image parameter
            image_param = None
            if imageBase64:
                image_param = imageBase64

            result = agent.analyze_person_jewish_identity(firstName, lastName, image_base64=image_param)

            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_error(500, f'Analysis failed: {str(e)}')

    def send_error(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))
