const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { initializeDatabase, verifyAdmin } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration
app.use(session({
  secret: 'library-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false // Set to true if using HTTPS
  }
}));

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

// Default books data
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
    console.log('Books file not found or invalid, using defaults');
    await saveBooks(defaultBooks);
    return defaultBooks;
  }
}

async function saveBooks(books) {
  await fs.writeFile(booksFilePath, JSON.stringify(books, null, 2));
}

// Authentication Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

// --- API Routes ---

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await verifyAdmin(username, password);
    if (admin) {
      req.session.adminId = admin.id;
      req.session.username = admin.username;
      console.log(`Admin logged in: ${username}`);
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Logout Route
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /api/books - Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await loadBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load books' });
  }
});

// GET /api/books/:id - Get a single book
app.get('/api/books/:id', async (req, res) => {
  try {
    const books = await loadBooks();
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load book' });
  }
});

// GET /api/books/:id/content - Get book content
app.get('/api/books/:id/content', async (req, res) => {
  try {
    const books = await loadBooks();
    const book = books.find(b => b.id === parseInt(req.params.id));
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const filePath = path.join(__dirname, book.file);
    const content = await fs.readFile(filePath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load book content' });
  }
});

// Protected Routes (Require Login)

// POST /api/books - Add a new book
app.post('/api/books', isAuthenticated, upload.single('bookFile'), async (req, res) => {
  try {
    const { title, author, year, coverData } = req.body;

    if (!title || !author || !year || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const books = await loadBooks();
    const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;

    const newBook = {
      id: newId,
      title,
      author,
      year: parseInt(year),
      cover: coverData || null,
      file: `uploads/${req.file.filename}`
    };

    books.push(newBook);
    await saveBooks(books);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// PUT /api/books/:id - Update a book
app.put('/api/books/:id', isAuthenticated, async (req, res) => {
  try {
    const { title, author, year, cover } = req.body;
    const books = await loadBooks();
    const index = books.findIndex(b => b.id === parseInt(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Book not found' });

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
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', isAuthenticated, async (req, res) => {
  try {
    const books = await loadBooks();
    const index = books.findIndex(b => b.id === parseInt(req.params.id));

    if (index === -1) return res.status(404).json({ error: 'Book not found' });

    const book = books[index];
    if (book.file.startsWith('uploads/')) {
      try {
        await fs.unlink(path.join(__dirname, book.file));
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    books.splice(index, 1);
    await saveBooks(books);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
