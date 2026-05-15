from google import genai

# 1. Hardcode your GEMINI key here (starts with AIza...)
# Do NOT use os.getenv() for this test!
test_key = "AIzaSyDdh2sweSSS1GOsK-f5eiqcqKx7DwU07_k"

print("Initializing Client...")
client = genai.Client(api_key=test_key)

print("Pinging Gemini...")
try:
    response = client.models.generate_content(
        model='gemini-flash-latest',
        contents='Reply with exactly two words: "Connection successful!"'
    )
    print(f"✅ Success! AI says: {response.text}")
except Exception as e:
    print(f"❌ Failed: {e}")