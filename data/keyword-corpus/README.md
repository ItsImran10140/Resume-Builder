# Keyword corpus

Place O*NET exports and job-board keyword lists here for offline enrichment.

Suggested layout:

```
keyword-corpus/
  onet/          # O*NET skill + occupation keywords
  job-boards/    # Curated role templates (e.g. software-engineer.json)
```

The FastAPI scorer currently uses in-request `target_keywords` and built-in defaults. Wire corpus files in `backend/app/services/keywords.py` when you are ready.
