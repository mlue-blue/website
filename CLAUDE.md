# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Start the server: `npm start`
Development mode with auto-reload: `npm run dev`

The server runs on `http://localhost:3000` by default (configurable via PORT environment variable).

## Architecture

This is a simple personal library application with a Node.js/Express backend serving static HTML/CSS/JS frontend.

### Backend (server.js)
- Express server with CORS enabled
- Uses `multer` for handling file uploads (10MB limit)
- Books are stored in two ways:
  - **Default books**: Plain `.txt` files in `books/` directory (e.g., `books/great-gatsby.txt`)
  - **Uploaded books**: Stored in `uploads/` directory with generated filenames (`book-{timestamp}-{random}.ext`)
- Book metadata (title, author, year, cover, file path) is persisted in `data/books.json`
- Directories `uploads/` and `data/` are auto-created on server startup if missing

### Frontend
- `index.html` - Main library page with book grid and search
- `add-book.html` - Form to add new books
- `books.js` - Shared frontend logic that:
  - Fetches books via REST API at `/api/books`
  - Renders book cards with hover preview (first 200 chars of content)
  - Opens books in a modal for reading
  - Handles form submission with FormData for file uploads
  - Converts cover images to Data URLs for storage
- `styles.css` - All styling with CSS variables for theming

## API Endpoints

- `GET /api/books` - Returns array of all books
- `GET /api/books/:id` - Returns single book metadata
- `GET /api/books/:id/content` - Returns raw book content as text
- `POST /api/books` - Uploads new book (multipart/form-data with `bookFile`, `title`, `author`, `year`, optional `coverData`)
- `PUT /api/books/:id` - Updates book metadata
- `DELETE /api/books/:id` - Deletes book and its uploaded file (if in `uploads/`)

## Book Data Model

```json
{
  "id": 1,
  "title": "Book Title",
  "author": "Author Name",
  "year": 1925,
  "cover": null,  // or base64 data URL string
  "file": "books/filename.txt"  // or "uploads/book-timestamp-random.txt"
}
```

## Default Books

The server initializes with two default books (Great Gatsby and The Christmas Dwella) stored in `books/` directory. These are hardcoded in `defaultBooks` array and only created if `data/books.json` doesn't exist.

## File Upload Flow

1. User selects `.txt` file and optionally cover image
2. Frontend converts cover to Data URL (base64)
3. FormData sent with `bookFile`, `title`, `author`, `year`, `coverData`
4. Multer saves the book file to `uploads/` with generated filename
5. Book metadata (including uploads path) saved to `data/books.json`