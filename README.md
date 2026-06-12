# CampusSense AI — Smart Campus Navigation System

CampusSense AI is a smart campus navigation system built for BIET. It provides an interactive campus map, shortest-path routing between campus locations using Dijkstra's algorithm, and an AI-powered campus assistant to help users find their way around the campus.

## Features

- **Interactive Campus Map**: Visual interface for exploring the campus layout.
- **Smart Navigation**: Calculates the shortest walking paths between locations using Dijkstra's algorithm. Also includes an accessibility mode for wheelchair-accessible routes.
- **AI Assistant**: A chat interface powered by Hugging Face models to answer queries about campus locations and navigation.
- **Search History & Analytics**: Tracks recent searches and provides analytics data.
- **Cloud Database**: Stores campus locations and route connections using Supabase.

## Technologies Used

- **Backend**: Python, Flask
- **Routing Algorithm**: Dijkstra's Shortest Path
- **Database**: Supabase (PostgreSQL)
- **AI/NLP**: Hugging Face API integration
- **Frontend**: HTML, CSS, JavaScript (Vanilla/Jinja Templates)

## Setup and Installation

### Prerequisites
- Python 3.8+
- Supabase account with your database configured
- Hugging Face API token

### 1. Clone the repository and navigate to the project directory
Ensure you are in the project root directory.

### 2. Create a Virtual Environment (Optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory based on the `.env.example` file (if available) or add the following keys:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_token
PORT=5000
```

### 5. Run the Application
```bash
python app.py
```
The application will be running in debug mode at `http://localhost:5000`.

## Project Structure

- `app.py`: Main Flask application handling routing and API endpoints.
- `dijkstra.py`: Implementation of Dijkstra's algorithm for finding the shortest path.
- `database.py` / `supabase_client.py`: Supabase database connection and query logic.
- `ai_assistant.py`: Hugging Face API integration for the chat assistant.
- `templates/`: HTML templates for the frontend.
- `static/`: Static assets (CSS, JS, images).
- `add_departments.py`: Utility script for managing campus locations.

## License

This project is licensed under the MIT License.
