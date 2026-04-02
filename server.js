const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    console.log('Directories ensured: uploads/, data/');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

ensureDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'book-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Default books data (only include books that actually exist)
const defaultBooks = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    year: 1925,
    cover: null,
    file: "books/great-gatsby.txt"
  },
  {
    id: 2,
    title: "The Christmas Dwella",
    author: "Mr. Burp",
    year: 2025,
    cover: null,
    file: "books/the-christmas-dwella.txt"
  }
];

// Helper functions
const booksFilePath = path.join(dataDir, 'books.json');

async function loadBooks() {
  try {
    const data = await fs.readFile(booksFilePath, 'utf8');
    const books = JSON.parse(data);
    return books;
  } catch (error) {
    // File doesn't exist or is invalid, return defaults
    console.log('Books file not found or invalid, using defaults');
    await saveBooks(defaultBooks);
    return defaultBooks;
  }
}

async function saveBooks(books) {
  await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2));
  console.log(`Saved ${books.length} books to ${booksFilePath}`);
}

// API Routes

// GET /api/books - Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await loadBooks();
    res.json(books);
  } catch (error) {
    console.error('Error loading books:', error);
    res.status(500).json({ error: 'Failed to load books', details: error.message });
  }
});

// GET /api/books/:id - Get a single book
app.get('/api/books/:id', async (req, res) => {
  try {
    const books = await loadBooks();
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error loading book:', error);
    res.status(500).json({ error: 'Failed to load book', details: error.message });
  }
});

// GET /api/books/:id/content - Get book content
app.get('/api/books/:id/content', async (req, res) => {
  try {
    const books = await loadBooks();
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) {
      console.error(`Book not found with id: ${req.params.id}`);
      return res.status(404).json({ error: 'Book not found' });
    }

    let content;
    let filePath;

    if (book.file.startsWith('uploads/')) {
      // Book is in uploads directory
      filePath = path.join(__dirname, book.file);
    } else {
      // Book is in books directory
      filePath = path.join(__dirname, book.file);
    }

    console.log(`Reading book content from: ${filePath}`);
    content = await fs.readFile(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    console.error('Error loading book content:', error);
    res.status(500).json({ error: 'Failed to load book content', details: error.message });
  }
});

// POST /api/books - Add a new book
app.post('/api/books', upload.single('bookFile'), async (req, res) => {
  try {
    console.log('POST /api/books received');
    console.log('Body fields:', Object.keys(req.body));
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

    const { title, author, year, coverData } = req.body;

    if (!title || !author || !year) {
      console.error('Missing required fields:', { title, author, year });
      return res.status(400).json({ error: 'Missing required fields: title, author, and year are required' });
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const books = await loadBooks();

    // Generate new ID
    const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;

    // Handle cover image if uploaded
    let cover = null;
    if (coverData) {
      cover = coverData;
      console.log('Cover image included, length:', coverData.length);
    }

    const newBook = {
      id: newId,
      title,
      author,
      year: parseInt(year),
      cover,
      file: `uploads/${req.file.filename}`
    };

    console.log('Adding new book:', newBook);
    books.push(newBook);
    await saveBooks(books);

    console.log(`Book added successfully with id: ${newId}`);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Failed to add book', details: error.message });
  }
});

// PUT /api/books/:id - Update a book
app.put('/api/books/:id', async (req, res) => {
  try {
    const { title, author, year, cover } = req.body;
    const books = await loadBooks();
    const index = books.findIndex(b => b.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }

    books[index] = {
      ...books[index],
      title: title || books[index].title,
      author: author || books[index].author,
      year: year ? parseInt(year) : books[index].year,
      cover: cover !== undefined ? cover : books[index].cover
    };

    await saveBooks(books);
    res.json(books[index]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book', details: error.message });
  }
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const books = await loadBooks();
    const index = books.findIndex(b => b.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Delete the file if it's in uploads directory
    const book = books[index];
    if (book.file.startsWith('uploads/')) {
      try {
        await fs.unlink(path.join(__dirname, book.file));
        console.log(`Deleted file: ${book.file}`);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    books.splice(index, 1);
    await saveBooks(books);

    console.log(`Book deleted with id: ${req.params.id}`);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Add books by visiting http://localhost:${PORT}/add-book.html`);
});