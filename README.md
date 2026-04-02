# Personal Library

A personal book library application with a Node.js backend.

## Features

- View and search books in your personal library
- Add new books from your computer
- Read books directly in the browser
- Cover image support for books
- Persistent storage using file-based backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Adding Books

1. Click the "Add Book" button on the main page
2. Select a .txt file from your computer
3. Enter the book details (title, author, year)
4. Optionally add a cover image
5. Click "Add Book"

## API Endpoints

- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get a single book
- `GET /api/books/:id/content` - Get book content
- `POST /api/books` - Add a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

## Project Structure

```
website/
├── server.js           # Node.js backend server
├── books.js            # Frontend JavaScript
├── index.html          # Main library page
├── add-book.html       # Add book form
├── styles.css          # Styling
├── books/              # Book text files
├── uploads/            # Uploaded book files (auto-created)
├── data/               # Book metadata (auto-created)
└── package.json        # Node.js dependencies
```