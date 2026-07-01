# Personal Library Project Context

This project is a web-based Personal Library application that allows users to upload, manage, and read digital books (specifically `.txt` files).

## Project Overview

- **Type:** Node.js Web Application
- **Architecture:** Monolithic with a RESTful API backend and a Vanilla JS/HTML/CSS frontend.
- **Core Technologies:**
    - **Backend:** Node.js, Express.js
    - **Database:** 
        - SQLite3 (for admin user management).
        - JSON-based file storage (for book metadata in `data/books.json`).
    - **File Handling:** Multer (for uploads), `fs` module (for reading book content).
    - **Frontend:** Vanilla HTML, CSS, and JavaScript (using `fetch` API).

## Directory Structure

- `server.js`: Main entry point and API route definitions.
- `database.js`: SQLite database initialization and admin user logic.
- `books.js`: Frontend logic for fetching, rendering, and managing books.
- `index.html`: Main dashboard for viewing the library.
- `add-book.html`: Interface for uploading new books.
- `styles.css`: Global styling.
- `books/`: Directory for pre-loaded default book text files.
- `uploads/`: Directory for user-uploaded book files.
- `data/`: Directory for persistent data (`books.json` and `library.db`).

## Building and Running

### Prerequisites
- Node.js installed.
- Dependencies installed via `npm install`.

### Key Commands
- **Start Server:** `npm start` (Runs `node server.js`)
- **Development Mode:** `npm run dev` (Runs `node --watch server.js`)
- **Setup:** The server automatically creates `uploads/` and `data/` directories and initializes the database on first run.

## API Endpoints

- `GET /api/books`: Returns a list of all book metadata.
- `GET /api/books/:id`: Returns metadata for a specific book.
- `GET /api/books/:id/content`: Returns the raw text content of a book.
- `POST /api/books`: Adds a new book (requires `multipart/form-data` with a `bookFile`).
- `PUT /api/books/:id`: Updates metadata for an existing book.
- `DELETE /api/books/:id`: Removes a book and its associated file from `uploads/`.

## Development Conventions

- **Data Management:** Book metadata is primarily managed in `data/books.json`. Always ensure this file is updated when books are added or removed.
- **File Types:** The application currently focuses on `.txt` files for book content.
- **Covers:** Book covers are stored as Base64 strings directly within the book's metadata object in `books.json`.
- **Error Handling:** Backend routes use `try/catch` blocks and return appropriate HTTP status codes (400, 404, 500) with JSON error messages.
- **Frontend State:** The frontend re-fetches the book list from the API after modifications (add/delete) to ensure the UI stays in sync with the server.
