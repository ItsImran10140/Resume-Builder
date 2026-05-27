# ATS Scorer API (FastAPI)

Python service for resume section extraction (spaCy) and ATS scoring (TF-IDF + weighted rubric).

## Setup

**Python version:** Use **3.11 or 3.12** if you want spaCy. **3.14** works with the default setup (regex section parsing + sklearn).

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy env.example .env
uvicorn app.main:app --reload --port 8000
```

.venv\Scripts\activate

Optional spaCy (Python 3.11–3.12 only):

```bash
pip install "spacy>=3.8.13"
python -m spacy download en_core_web_sm
```

Health: `GET http://localhost:8000/health`  
Score: `POST http://localhost:8000/api/v1/score`
