import fs from 'fs';
import path from 'path';

const SHEET_ID = process.env.SHEETS_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const RANGE = "'Stock list'!A:Q";
const CACHE_PATH = path.resolve('.covers-cache.json');

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isValidImage(url) {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    console.log(`Image size for ${url}: ${buffer.byteLength} bytes`);
    return buffer.byteLength > 16000;
  } catch {
    return false;
  }
}

async function fetchCover(isbn, title, author) {
  try {
    let query;
    if (isbn && isbn !== '0') {
      query = `isbn:${isbn}`;
    } else {
      query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
    }
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_API_KEY}&maxResults=1`;

    let res = await fetch(url);
    let data = await res.json();

    if (data.error?.code === 429) {
      console.log(`Rate limited for ${title}, retrying after 10s...`);
      await sleep(10000);
      res = await fetch(url);
      data = await res.json();
    }

    if (data.error?.code === 429) {
      console.log(`Rate limited again for ${title}, skipping`);
      return 'RATE_LIMITED';
    }

    const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    if (!thumbnail) return null;
    const large = thumbnail.replace('zoom=1', 'zoom=2').replace('http://', 'https://');
    const largeValid = await isValidImage(large);

    return largeValid ? large : thumbnail;
  } catch (e) {
    console.log(`Error fetching cover for ${title}:`, e);
    return null;
  }
}

export default async function () {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  const [_headers, ...rows] = data.values;

  const books = rows.map(row => ({
    isbn: row[0],
    title: row[1],
    author: row[2],
    condition: row[8],
    sold: row[10],
    featured: row[16]
  }));

  const normalise = str => (str ?? "").trim().toLowerCase();
  const not_sold = books.filter(book => {
    return book.sold == "FALSE"
  })

  const unique = not_sold.filter((book, index, self) =>
    index === self.findIndex(b =>
      normalise(b.title) === normalise(book.title) &&
      normalise(b.author) === normalise(book.author) &&
      normalise(b.condition) === normalise(book.condition)
    )
  );

  unique.sort((a, b) => {
    const aFeatured = a.featured === "TRUE";
    const bFeatured = b.featured === "TRUE";
    if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  const cache = loadCache();

  for (const book of unique) {
    const cacheKey = `${book.title}__${book.author}`;
    if (!(cacheKey in cache)) {
      console.log(`Fetching cover for: ${book.title}`);
      const cover = await fetchCover(book.isbn, book.title, book.author);

      if (cover === 'RATE_LIMITED') {
        book.cover = null;
        continue;
      }

      cache[cacheKey] = cover;
      await sleep(1500);
      saveCache(cache);
    }
    book.cover = cache[cacheKey];
  }

  return unique;
};