from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import fitz

# =========================
# EMBEDDING MODEL
# =========================

model = None
def get_model():

    global model

    if model is None:

        model = SentenceTransformer(
            "all-MiniLM-L6-v2"
        )

    return model

# =========================
# GLOBAL STORAGE
# =========================

documents = []

index = None

# =========================
# LOAD PDF
# =========================

def load_pdf(file_path):

    pdf = fitz.open(file_path)

    pages = []

    for page_num in range(len(pdf)):

        page = pdf.load_page(page_num)

        text = page.get_text()

        pages.append({
            "text": text,
            "page": page_num + 1
        })

    return pages

# =========================
# SMART CHUNKING
# =========================

def chunk_text(text, chunk_size=1200):

    text = text.replace("\n", " ")

    sentences = text.split(". ")

    chunks = []

    chunk = ""

    for sentence in sentences:

        if len(chunk) + len(sentence) < chunk_size:

            chunk += sentence + ". "

        else:

            chunks.append(chunk.strip())

            chunk = sentence + ". "

    if chunk:

        chunks.append(chunk.strip())

    return chunks

# =========================
# ADD DOCUMENT
# =========================

def add_document(pages):

    global documents
    global index

    new_chunks = []

    for page_data in pages:

        text = page_data["text"]

        page = page_data["page"]

        chunks = chunk_text(text)

        for chunk in chunks:

            if len(chunk.strip()) < 40:
                continue

            documents.append({
                "content": chunk,
                "page": page
            })

            new_chunks.append(chunk)

    if len(new_chunks) == 0:
        return

    # Create embeddings
    embeddings = get_model.encode(
        new_chunks,
        show_progress_bar=True
    )

    embeddings = np.array(
        embeddings
    ).astype("float32")

    dimension = embeddings.shape[1]

    # Create FAISS index
    if index is None:

        index = faiss.IndexFlatL2(
            dimension
        )

    index.add(embeddings)

    print(f"Added {len(new_chunks)} chunks")

    print(
        f"Total documents: {len(documents)}"
    )

# =========================
# SEARCH
# =========================

def search(query, k=12):

    global index
    global documents

    if (
        index is None or
        len(documents) == 0
    ):

        return {
            "context":
                "No document uploaded yet.",
            "sources": []
        }

    # Embed query
    query_embedding = get_model.encode(
        [query]
    )

    query_embedding = np.array(
        query_embedding
    ).astype("float32")

    # Search
    distances, indices = index.search(
        query_embedding,
        k
    )

    results = []

    context_parts = []

    used_pages = set()

    for idx in indices[0]:

        if idx >= len(documents):
            continue

        doc = documents[idx]

        results.append({
            "page": doc["page"],
            "content": doc["content"]
        })

        if doc["page"] not in used_pages:

            context_parts.append(
                f"(Page {doc['page']})\n{doc['content']}"
            )

            used_pages.add(doc["page"])

        else:

            context_parts.append(
                doc["content"]
            )

    final_context = "\n\n".join(
        context_parts
    )

    return {
        "context": final_context,
        "sources": results
    }