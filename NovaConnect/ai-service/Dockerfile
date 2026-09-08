FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
# Assuming requirements.txt was already there, but let's make sure things exist or install directly
RUN pip install --no-cache-dir fastapi uvicorn spacy transformers scikit-learn pydantic torch

# Download English language model for SpaCy
RUN python -m spacy download en_core_web_sm

# Copy application files
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
