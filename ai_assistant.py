"""
AI Assistant Module for CampusSense AI
Provides campus-aware AI responses via Hugging Face Inference API.
Falls back to a keyword-matching engine when HF is not configured.
"""

import os
import json

# ---------------------------------------------------------------------------
# BIET Campus knowledge base for the system prompt
# ---------------------------------------------------------------------------

CAMPUS_CONTEXT = """You are CampusSense AI, an intelligent campus assistant for Bapuji Institute of Engineering and Technology (BIET), Davangere, Karnataka, India.

CAMPUS INFORMATION:
- Main Gate: Primary entrance to the campus
- Administrative Block: Houses the principal's office, admin offices, and examination cell
- Central Library: Main library with digital resources, reading halls, and reference section
- CSE Department: Computer Science and Engineering department with labs and classrooms
- ISE Department: Information Science and Engineering department
- AIML Department: Artificial Intelligence and Machine Learning department
- ECE Department: Electronics and Communication Engineering department
- EEE Department: Electrical and Electronics Engineering department
- Mechanical Department: Mechanical Engineering department with workshops
- Civil Department: Civil Engineering department
- MBA Department: Master of Business Administration block
- MCA Department: Master of Computer Applications block
- Placement Cell: Handles campus recruitment, training, and industry connections
- Auditorium: Main auditorium for events, seminars, and cultural programs
- Seminar Hall: Used for department seminars and guest lectures
- Canteen: Campus food court serving meals and snacks
- Parking Area: Vehicle parking near the main gate
- Sports Ground: Athletic facilities including cricket ground and basketball court

NAVIGATION TIPS:
- From Main Gate: Walk straight to reach Administrative Block (50m), turn left for Parking Area (35m)
- From Administrative Block: Central Library is 45m ahead, Auditorium is 40m to the right
- The Central Library connects to most department buildings
- Placement Cell is accessible from Administrative Block (60m)
- Canteen is reachable via Auditorium (85m) or Placement Cell (70m)

You help students, faculty, visitors, parents, and recruiters navigate the campus. Provide clear, helpful directions and campus information. Keep responses concise and friendly."""


# ---------------------------------------------------------------------------
# Fallback keyword-matching campus FAQ engine
# ---------------------------------------------------------------------------

FAQ_RESPONSES = {
    "cse": "The CSE Department is located near the Central Library. From the Main Gate, walk to the Administrative Block, then proceed to the Central Library and take the path to CSE Department. Estimated walking time: ~2 minutes.",
    "ise": "The ISE Department is adjacent to the CSE and AIML departments. You can reach it via the Central Library. Estimated walking time from Main Gate: ~3 minutes.",
    "aiml": "The AIML Department is near the ISE Department. From the Central Library, follow the path past CSE to reach AIML. Estimated walking time from Main Gate: ~3 minutes.",
    "ece": "The ECE Department is accessible from the Central Library (40m). It connects to the EEE Department nearby.",
    "eee": "The EEE Department is next to the ECE Department and connects to the Mechanical Department. From the Central Library, walk through ECE.",
    "mechanical": "The Mechanical Department is located in the western part of campus. From EEE Department, it's about 45m. It has engineering workshops and labs.",
    "civil": "The Civil Department is near the Mechanical Department (40m) and connects back to the Main Gate (75m).",
    "mba": "The MBA Department is accessible from the Auditorium (40m). It's located near the MCA Department.",
    "mca": "The MCA Department is next to the MBA Department (30m) and can also be reached from the Auditorium.",
    "library": "The Central Library is located 45m from the Administrative Block. It has digital resources, reading halls, a reference section, and connects to most department buildings.",
    "canteen": "The Canteen is reachable from the Auditorium (85m) or the Placement Cell (70m). It serves meals and snacks throughout the day.",
    "parking": "The Parking Area is right next to the Main Gate (35m). It connects to the Sports Ground.",
    "sports": "The Sports Ground is located at the far end of campus, accessible from the Parking Area (90m) or the Canteen (80m). It has cricket grounds and basketball courts.",
    "placement": "The Placement Cell handles campus recruitment and training. It's accessible from the Administrative Block (60m) and the Central Library.",
    "auditorium": "The Auditorium is 40m from the Administrative Block. It hosts events, seminars, and cultural programs. It connects to the Seminar Hall and Canteen.",
    "seminar": "The Seminar Hall is next to the Auditorium (50m). It's used for department seminars and guest lectures.",
    "admin": "The Administrative Block houses the principal's office, admin offices, and the examination cell. It's 50m from the Main Gate.",
    "gate": "The Main Gate is the primary entrance to the BIET campus. From here, you can reach the Administrative Block (50m) or the Parking Area (35m).",
    "hostel": "The campus has hostel facilities. Please check with the Administrative Block for hostel information.",
    "hello": "Hello! Welcome to CampusSense AI. I can help you navigate the BIET campus, find departments, and answer questions about campus facilities. How can I assist you?",
    "hi": "Hi there! I'm CampusSense AI, your campus navigation assistant. Ask me about any location on the BIET campus!",
    "help": "I can help you with:\n• Finding directions to any campus building\n• Information about departments and facilities\n• Navigation tips and walking times\n• Campus events and facilities info\nJust ask me anything about BIET!",
    "dijkstra": "CampusSense uses Dijkstra's Algorithm to find the shortest path between campus locations. It has a time complexity of O((V + E) log V) and guarantees the optimal route.",
    "biet": "Bapuji Institute of Engineering and Technology (BIET) is a premier engineering college in Davangere, Karnataka, India. It offers undergraduate and postgraduate programs in various engineering disciplines.",
}


def _fallback_response(message):
    """Generate a response using keyword matching against the campus FAQ."""
    text = message.lower().strip()

    for keyword, response in FAQ_RESPONSES.items():
        if keyword in text:
            return response

    # Generic fallback
    return (
        "I'm CampusSense AI, your BIET campus navigation assistant. "
        "I can help you find directions to departments, facilities, and buildings on campus. "
        "Try asking me things like:\n"
        "• 'Where is the CSE Department?'\n"
        "• 'How do I reach the library from the main gate?'\n"
        "• 'Tell me about the placement cell'\n"
        "• 'Where is the canteen?'"
    )


# ---------------------------------------------------------------------------
# Hugging Face Inference API
# ---------------------------------------------------------------------------

def get_ai_response(message):
    """
    Get an AI response for a campus-related question.
    Uses Hugging Face Inference API if configured, otherwise falls back to FAQ.

    Args:
        message (str): User's question or message

    Returns:
        str: AI-generated or FAQ-matched response
    """
    hf_key = os.getenv("HUGGINGFACE_API_KEY")

    if not hf_key:
        return _fallback_response(message)

    try:
        import requests

        model = "mistralai/Mistral-7B-Instruct-v0.3"
        url = f"https://api-inference.huggingface.co/models/{model}"

        headers = {
            "Authorization": f"Bearer {hf_key}",
            "Content-Type": "application/json",
        }

        # Format prompt with campus context
        prompt = f"<s>[INST] {CAMPUS_CONTEXT}\n\nUser question: {message}\n\nProvide a helpful, concise response about the BIET campus. [/INST]"

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 250,
                "temperature": 0.7,
                "return_full_text": False,
            },
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                generated = data[0].get("generated_text", "").strip()
                if generated:
                    return generated

            return _fallback_response(message)

        elif response.status_code == 503:
            # Model is loading
            return "The AI model is currently loading. Please try again in a moment. " + _fallback_response(message)

        else:
            print(f"[CampusSense] HF API error {response.status_code}: {response.text}")
            return _fallback_response(message)

    except ImportError:
        print("[CampusSense] requests package not installed")
        return _fallback_response(message)
    except Exception as e:
        print(f"[CampusSense] AI request failed: {e}")
        return _fallback_response(message)
