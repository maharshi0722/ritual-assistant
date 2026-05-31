// lib/search.js — TF-IDF chunker and search, runs server or client

export function chunkMarkdown(text, source) {
  const TARGET = 800;
  const OVERLAP = 150;
  const blocks = splitBlocks(text);
  const chunks = [];
  let buf = "";

  for (const block of blocks) {
    if (buf.length > 0 && buf.length + block.length > TARGET) {
      chunks.push({ text: buf.trim(), source, index: chunks.length });
      buf = buf.slice(-OVERLAP) + "\n" + block;
    } else {
      buf += (buf ? "\n" : "") + block;
    }
  }
  if (buf.trim())
    chunks.push({ text: buf.trim(), source, index: chunks.length });
  return chunks;
}

function splitBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let cur = [];
  let inCode = false,
    inTable = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        if (cur.length) {
          blocks.push(cur.join("\n"));
          cur = [];
        }
        inCode = true;
        cur.push(line);
      } else {
        cur.push(line);
        blocks.push(cur.join("\n"));
        cur = [];
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      cur.push(line);
      continue;
    }
    const isRow = line.trim().startsWith("|");
    if (isRow && !inTable) {
      if (cur.length) {
        blocks.push(cur.join("\n"));
        cur = [];
      }
      inTable = true;
      cur.push(line);
      continue;
    }
    if (inTable && !isRow) {
      blocks.push(cur.join("\n"));
      cur = [];
      inTable = false;
    }
    if (inTable) {
      cur.push(line);
      continue;
    }
    if (line.startsWith("#")) {
      if (cur.length) {
        blocks.push(cur.join("\n"));
        cur = [];
      }
      cur.push(line);
      continue;
    }
    if (line.trim() === "") {
      if (cur.length) {
        blocks.push(cur.join("\n"));
        cur = [];
      }
      continue;
    }
    cur.push(line);
  }
  if (cur.length) blocks.push(cur.join("\n"));
  return blocks.filter((b) => b.trim().length > 8);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[`*#|_]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function buildIDF(chunks) {
  const df = {};
  for (const c of chunks) {
    for (const t of new Set(tokenize(c.text))) df[t] = (df[t] || 0) + 1;
  }
  const N = chunks.length;
  const idf = {};
  for (const [term, count] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (count + 1)) + 1;
  }
  return idf;
}

export function buildIndex(chunks) {
  return { chunks, idf: buildIDF(chunks) };
}

export function searchChunks(index, query, topK = 4) {
  const qTokens = tokenize(query);
  const scored = index.chunks.map((chunk) => {
    const docTokens = tokenize(chunk.text);
    let score = 0;
    for (const qt of qTokens) {
      const tfVal = docTokens.filter((t) => t === qt).length / docTokens.length;
      score += tfVal * (index.idf[qt] || 0);
    }
    if (chunk.text.toLowerCase().includes(query.toLowerCase())) score *= 2.5;
    const lowerQuery = query.toLowerCase();
    if (
      lowerQuery.includes("use case") ||
      lowerQuery.includes("use cases") ||
      lowerQuery.includes("use-case") ||
      lowerQuery.includes("use-cases")
    ) {
      if (chunk.source === "use-cases") score += 3;
    }
    if (
      lowerQuery.includes("research") ||
      lowerQuery.includes("frontier") ||
      lowerQuery.includes("artificial intelligence") ||
      lowerQuery.includes("mechanism design") ||
      lowerQuery.includes("systems") ||
      lowerQuery.includes("cryptography")
    ) {
      if (chunk.source === "research") score += 3;
    }
    if (
      lowerQuery.includes("team") ||
      lowerQuery.includes("people") ||
      lowerQuery.includes("founder") ||
      lowerQuery.includes("member") ||
      lowerQuery.includes("who is") ||
      lowerQuery.includes("who are")
    ) {
      if (chunk.source === "team") score += 3;
    }
    if (
      lowerQuery.includes("ritual-dapp") ||
      lowerQuery.includes("dapp skills") ||
      lowerQuery.includes("ritual skills") ||
      lowerQuery.includes("skill system") ||
      lowerQuery.includes("ritual dapp")
    ) {
      if (chunk.source === "ritual-dapp-skills") score += 4;
    }
    const addrMatch = query.match(/0x[0-9a-fA-F]{4}/g);
    if (addrMatch)
      for (const a of addrMatch) if (chunk.text.includes(a)) score += 5;
    return { ...chunk, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((c) => c.score > 0);
}
