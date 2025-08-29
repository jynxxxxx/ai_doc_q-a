# ai_doc_q-a

This FastAPI and React application allows users to upload PDF documents, extract their content, and ask AI-powered questions about them. It integrates a Chroma vector database for retrieval-augmented generation (RAG), providing accurate and contextual responses based directly on the uploaded documents.

*(**Note:** Currently, ChromaDB is not persistent. Shutting down or restarting the backend will cause the vector database to be lost, and documents will need to be reuploaded.) This behavior is intentional, as the application is currently designed to run locally and does not require persistent storage.*

## Features

- RAG 
- Sign up / log in via Supabase Auth
- Document Management
- Content Extraction & Chunking

## Installation

1.  Clone the repository:
```bash
git clone <repository_url>
cd ai_doc_q-a
```

2.  Set up the backend (FastAPI):
    - Navigate to the `backend` directory: `cd backend`
    - Create a virtual environment: `python3 -m venv venv`
    - Activate the virtual environment: `source venv/bin/activate`
    - Install dependencies: `pip install -r requirements.txt`
    - Configure environment variables (see below).
```
SUPABASE_DB_URL=your_supabase_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_CLIENT_URL=your_supabase_client_url
GOOGLE_API_KEY=your_google_api_key
```

3. Start Supabase:
    - Follow the official Supabase documentation to set up a Supabase project: <https://supabase.com/docs>
    - Obtain your Supabase Keys, and use it as environment variables for the backend.

4.  Set up the frontend (React):
    - Navigate to the `frontend` directory: `cd ../frontend`
    - Install dependencies: `npm install`

## Usage

1.  Start the backend (FastAPI):
    - Navigate to the `backend` directory: `cd ./backend`
    - Activate the virtual environment if not already activated: `source venv/bin/activate`
    - Run the FastAPI application: `uvicorn app.main:app --reload`

2.  Start the frontend (React):
    - Navigate to the `frontend` directory: `cd ../frontend`
    - Run the React application: `npm run dev`

3.  Open your browser and navigate to the address where the React application is running (usually `http://localhost:3000`).
4. Sign up or log in.
5. Upload PDF documents.
6. Ask questions related to the uploaded documents. The AI will provide answers based on the content of the documents.

## Technologies Used

- TypeScript
- Python
- FastAPI
- React
- Tailwind CSS
- Supabase
- Gemini AI
- ChromaDB

## License

none
