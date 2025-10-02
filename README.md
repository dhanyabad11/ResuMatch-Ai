# ResuMatch AI

An AI-powered resume analyzer that helps job seekers optimize their resumes using Google Gemini AI. The application provides comprehensive feedback on resume content, structure, and alignment with job descriptions.

## Features

-   **ATS-Friendly Analysis**: Optimize your resume to pass Applicant Tracking Systems
-   **Job Match Scoring**: Get precise compatibility scores against job descriptions
-   **Keyword Optimization**: Identify missing keywords and improve keyword density
-   **PDF Resume Upload**: Simple drag-and-drop resume upload interface
-   **AI-Powered Analysis**: Uses Google Gemini AI for intelligent resume evaluation
-   **Comprehensive Feedback**: Get actionable insights on:
    -   ATS compatibility score (X/10)
    -   Missing critical keywords from job descriptions
    -   Skills alignment percentage
    -   Formatting and structure improvements
    -   Specific optimization recommendations
    -   Industry best practices

Perfect for job seekers targeting Big Tech roles and competitive positions!

## Why ResuMatch AI?

Many qualified candidates get rejected not because they lack skills, but because their resumes don't pass ATS systems or match job description keywords. ResuMatch AI solves this by:

-   **Beating ATS Systems**: Analyzes formatting and structure for ATS compatibility
-   **Keyword Optimization**: Identifies exactly which keywords you're missing from job descriptions
-   **Realistic Scoring**: Provides honest assessment of your chances of getting shortlisted
-   **Actionable Feedback**: Gives specific, implementable suggestions to improve your resume

Users have successfully optimized their resumes using this tool and landed offers at major tech companies!

## Tech Stack

### Frontend

-   **Next.js 14** with TypeScript and Tailwind CSS
-   **Axios** for API requests
-   Responsive design with modern UI components

### Backend

-   **Python Flask** REST API server
-   **Google Generative AI (Gemini)** for resume analysis (easily swappable with OpenAI)
-   **PyPDF2** for PDF text extraction
-   **Flask-CORS** for cross-origin requests

## Project Structure

```
ResuMatch-Ai/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx      # Main upload and analysis page
│   │       ├── layout.tsx    # App layout
│   │       └── globals.css   # Global styles
│   ├── package.json
│   └── ...
├── backend/           # Flask backend API
│   ├── app.py        # Main Flask application
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

-   Node.js 18+ and npm
-   Python 3.8+
-   Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Create a virtual environment:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4. Create environment file:

    ```bash
    cp .env.example .env
    ```

5. Add your Google Gemini API key to `.env`:

    ```
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

6. Run the Flask server:
    ```bash
    python app.py
    ```

The backend server will start on `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create environment file (optional):

    ```bash
    cp .env.example .env
    ```

4. Configure environment variables in `.env` (optional):

    ```
    NEXT_PUBLIC_API_URL=http://localhost:5001
    NEXT_PUBLIC_APP_NAME=ResuMatch AI
    NEXT_PUBLIC_APP_DESCRIPTION=AI-powered resume analysis to help you stand out from the crowd
    ```

5. Run the development server:
    ```bash
    npm run dev
    ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### `POST /analyze-resume`

Analyzes a resume PDF file with optional job description.

**Request:**

-   `resume`: PDF file (multipart/form-data)
-   `job_description`: Optional job description text

**Response:**

```json
{
    "success": true,
    "analysis": "Detailed AI analysis...",
    "extracted_text": "Extracted resume text..."
}
```

### `POST /extract-text`

Extracts text from a PDF resume without analysis.

**Request:**

-   `resume`: PDF file (multipart/form-data)

**Response:**

```json
{
    "success": true,
    "extracted_text": "Extracted resume text..."
}
```

### `GET /`

Health check endpoint.

## Usage

1. Start both backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Upload a PDF resume file
4. Optionally paste a job description for targeted analysis
5. Click "Analyze Resume" to get AI-powered feedback

## Getting Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

## Development

### Frontend Development

-   Built with Next.js 14 App Router
-   Uses TypeScript for type safety
-   Styled with Tailwind CSS
-   File upload with drag-and-drop support

### Backend Development

-   Flask REST API with CORS support
-   Error handling and validation
-   PDF processing with PyPDF2
-   Google Gemini AI integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.
