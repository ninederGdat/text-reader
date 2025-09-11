export class VectorMath {
  static cosineSimilarity(A, B) {
    if (A.length !== B.length) {
      throw new Error("Vectors must be the same length");
    }
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < A.length; i++) {
      dot += A[i] * B[i];
      normA += A[i] * A[i];
      normB += B[i] * B[i];
    }
    const cosSim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    console.log(`Cosine Similarity: ${cosSim}\n`);
    return cosSim;
  }

  static angleBetweenVectors(A, B, inDegrees = true) {
    const cosSim = this.cosineSimilarity(A, B);
    const clamped = Math.max(-1.0, Math.min(1.0, cosSim));
    const angleRad = Math.acos(clamped);
    return inDegrees ? (angleRad * 180) / Math.PI : angleRad;
  }
}
