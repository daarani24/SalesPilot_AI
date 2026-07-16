import os
import chromadb
from chromadb.utils import embedding_functions

CATALOG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "knowledge_base", "techhub_catalog.txt"
)
 
CHROMA_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
 
def _split_into_chunks(raw_text: str)->list[str]:
    """
    Splits the catalog into chunks using the '====' section dividers.
    Each chunk keeps a section together (e.g. one product's full spec sheet),
    which gives much better search results than splitting by fixed character count.
    """

    raw_chunks = raw_text.split("=====================================================")
    chunks = [chunk.strip() for chunk in raw_chunks if chunk.strip()]
    return chunks
 
class CatalogVectorStore:
    """
    Wraps ChromaDB so the rest of the app doesn't need to know how
    embeddings or vector search work internally — agents just call
    .search(query) and get back plain text.
    """
 
    def __init__(self):
       
        self.client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
 
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )

        self.collection = self.client.get_or_create_collection(
            name="techhub_catalog",
            embedding_function=self.embedding_fn,
        )

        if self.collection.count() == 0:
            self._build_index()
 
    def _build_index(self):
        """Reads the catalog file, chunks it, and stores embeddings in ChromaDB."""
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            raw_text = f.read()
 
        chunks = _split_into_chunks(raw_text)
 
        ids = [f"chunk_{i}" for i in range(len(chunks))]
 
        self.collection.add(documents=chunks, ids=ids)
        print(f"[vector_store] Indexed {len(chunks)} catalog chunks into ChromaDB.")
 
    def search(self, query: str, top_k: int = 3)->list[str]:
        """
        Returns the top_k most relevant catalog chunks for a given query.
        Example: search("laptop under 40000 for college") ->
                 returns the Acer Aspire 3 and HP 15s chunks.
        """
        results = self.collection.query(query_texts=[query], n_results=top_k)

        return results["documents"][0] if results["documents"] else []

catalog_store = CatalogVectorStore()
 
if __name__ == "__main__":
   
    test_query = "laptop under 40000 for a college student"
    print(f"\nTest query: {test_query}\n")
    for i, chunk in enumerate(catalog_store.search(test_query), 1):
        print(f"--- Result {i} ---\n{chunk}\n")
 