from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from llm import generate_response

import rag
from rag import load_pdf, add_document, search
from fastapi.staticfiles import StaticFiles
import os
import shutil
print("MAIN FILE STARTED")
os.makedirs("uploads", exist_ok=True)
app = FastAPI()
print("FASTAPI STARTING")
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aegis-ai-research-assistant.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    history: list = []


@app.post("/chat")
def chat(req: ChatRequest):

    history_text = ""

    for msg in req.history:
        history_text += f"{msg['role']}: {msg['content']}\n"

    # =========================
    # SUMMARY MODE
    # =========================

    if "summarize" in req.message.lower():

        if len(rag.documents) == 0:

            return StreamingResponse(
                iter(["No PDF uploaded yet."]),
                media_type="text/plain"
            )

        context = " ".join(
            [doc["content"] for doc in rag.documents[3:8]]
        )

        prompt = f"""
You are an AI study assistant.

Summarize the following study material in simple student-friendly points.

Content:
{context}

Summary:
"""

        return StreamingResponse(
            generate_response(prompt),
            media_type="text/plain"
        )

    # =========================
    # QUESTION ANSWERING MODE
    # =========================

    # Conversational Retrieval
    conversation_query = history_text + "\nUser: " + req.message
    enhanced_query = f"""
Question about:
{req.message}

Related educational concepts,
definitions,
biographical information,
explanations,
dates,
history,
examples
"""

    search_result = search(enhanced_query)

    context = search_result["context"]

    sources = search_result["sources"]

    prompt = f"""
You are an intelligent AI study assistant.

Use the uploaded document context as the PRIMARY source.

If the context contains partial information,
answer naturally using both:
1. the document context
2. general educational knowledge

Only say:
"I could not find that in the uploaded document."

if the topic is completely unrelated.

Explain concepts clearly,
in simple student-friendly language.

Previous Conversation:
{history_text}

Context:
{context}

Question:
{req.message}

Answer:
"""

    pages = sorted(
        list(set([s["page"] for s in sources]))
    )

    citation_text = "\n\nSources: " + ", ".join(
        [f"Page {p}" for p in pages]
    )

    def final_stream():

        for chunk in generate_response(prompt):
            yield chunk

        yield citation_text

    return StreamingResponse(
        final_stream(),
        media_type="text/plain"
    )


@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pages = load_pdf(file_path)

    add_document(pages)

    return {
    "message": f"{file.filename} uploaded successfully",
    "pdf_url": f"http://127.0.0.1:8000/uploads/{file.filename}"
}
if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=10000
    )