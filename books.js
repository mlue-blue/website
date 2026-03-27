// Sample book data - Add your books here
// Add the 'file' property with the path to your text file for each book
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
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        year: 1960,
        cover: null,
        file: "books/to-kill-a-mockingbird.txt"
    },
    {
        id: 3,
        title: "The Christmas Dwella",
        author: "Mr. Burp",
        year: 2025,
        cover: null,
        file: "books/the-christmas-dwella.txt"
    },
    {
        id: 4,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        year: 1813,
        cover: null,
        file: "books/pride-and-prejudice.txt"
    },
    {
        id: 5,
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
        year: 1951,
        cover: null,
        file: "books/catcher-in-the-rye.txt"
    },
    {
        id: 6,
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        year: 1937,
        cover: null,
        file: "books/the-hobbit.txt"
    }
];

// Load books from localStorage or use defaults
function loadBooks() {
    const stored = localStorage.getItem('personalLibraryBooks');
    return stored ? JSON.parse(stored) : defaultBooks;
}

let books = loadBooks();

// DOM Elements
const bookGrid = document.getElementById('bookGrid');
const searchInput = document.getElementById('searchInput');
const bookCount = document.getElementById('bookCount');
const noResults = document.getElementById('noResults');
const modal = document.getElementById('readingModal');
const modalTitle = document.getElementById('modalTitle');
const bookContent = document.getElementById('bookContent');
const closeBtn = document.getElementById('closeBtn');

// Render books
function renderBooks(booksToRender) {
    bookGrid.innerHTML = '';

    if (booksToRender.length === 0) {
        noResults.style.display = 'block';
        bookCount.textContent = '0';
        return;
    }

    noResults.style.display = 'none';
    bookCount.textContent = booksToRender.length;

    booksToRender.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        bookCard.innerHTML = `
            <div class="book-cover">
                ${book.cover ? `<img src="${book.cover}" alt="${book.title}">` : book.title.charAt(0)}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-year">${book.year}</p>
            </div>
            <div class="book-peek">
                <div class="peek-content" id="peek-${book.id}">Hover to preview...</div>
                <div class="peek-hint">Click to read more</div>
            </div>
        `;

        // Add click handler to open book
        bookCard.addEventListener('click', () => openBook(book));

        // Add hover handler to load preview
        bookCard.addEventListener('mouseenter', () => loadPreview(book));

        bookGrid.appendChild(bookCard);
    });
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );

    renderBooks(filteredBooks);
});

// Load book preview on hover
async function loadPreview(book) {
    const peekElement = document.getElementById(`peek-${book.id}`);
    if (!peekElement || peekElement.dataset.loaded) return;

    peekElement.textContent = 'Loading preview...';

    try {
        const response = await fetch(book.file);
        if (!response.ok) {
            peekElement.textContent = 'Preview unavailable';
            return;
        }

        const text = await response.text();
        // Get first 200 characters as preview
        const preview = text.trim().substring(0, 200);
        peekElement.textContent = `"${preview}"`;
        peekElement.dataset.loaded = 'true';
    } catch (error) {
        peekElement.textContent = 'Preview unavailable';
    }
}

// Open book in modal
async function openBook(book) {
    modalTitle.textContent = book.title;
    bookContent.innerHTML = '<div class="loading">Loading</div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    try {
        const response = await fetch(book.file);

        if (!response.ok) {
            throw new Error('Book file not found');
        }

        const text = await response.text();
        bookContent.innerHTML = text;
    } catch (error) {
        bookContent.innerHTML = `
            <div class="error">
                <p>Error loading book: ${error.message}</p>
                <p style="margin-top: 1rem;">Make sure the file exists at: ${book.file}</p>
            </div>
        `;
    }
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close button click
closeBtn.addEventListener('click', closeModal);

// Close on clicking outside modal
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
});

// Save books to localStorage
function saveBooks() {
    localStorage.setItem('personalLibraryBooks', JSON.stringify(books));
}

// Initial render
renderBooks(books);

// Add Book Form Handling
const addBookForm = document.getElementById('addBookForm');
if (addBookForm) {
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bookFile = document.getElementById('bookFile').files[0];
        const coverFile = document.getElementById('bookCover').files[0];
        const title = document.getElementById('bookTitle').value.trim();
        const author = document.getElementById('bookAuthor').value.trim();
        const year = parseInt(document.getElementById('bookYear').value);

        if (!bookFile) {
            alert('Please select a book file');
            return;
        }

        // Read book file content
        const bookContent = await bookFile.text();

        // Generate unique ID
        const newId = Date.now();

        // Store book content in localStorage
        localStorage.setItem(`book_${newId}`, bookContent);

        // Handle cover image if provided
        let coverDataUrl = null;
        if (coverFile) {
            coverDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(coverFile);
            });
        }

        // Create new book object
        const newBook = {
            id: newId,
            title,
            author,
            year,
            cover: coverDataUrl,
            file: `stored:${newId}` // Special marker for localStorage books
        };

        // Add to books array
        books.push(newBook);
        saveBooks();

        // Show success message
        document.getElementById('addBookForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
    });
}

// Update openBook to handle localStorage books
const originalOpenBook = openBook;
openBook = async function(book) {
    modalTitle.textContent = book.title;
    bookContent.innerHTML = '<div class="loading">Loading</div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    try {
        let text;

        if (book.file.startsWith('stored:')) {
            // Book is stored in localStorage
            const bookId = book.file.replace('stored:', '');
            text = localStorage.getItem(`book_${bookId}`);
            if (!text) {
                throw new Error('Book content not found');
            }
        } else {
            // Fetch from file
            const response = await fetch(book.file);
            if (!response.ok) {
                throw new Error('Book file not found');
            }
            text = await response.text();
        }

        bookContent.innerHTML = text;
    } catch (error) {
        bookContent.innerHTML = `
            <div class="error">
                <p>Error loading book: ${error.message}</p>
            </div>
        `;
    }
};

// Update loadPreview to handle localStorage books
const originalLoadPreview = loadPreview;
loadPreview = async function(book) {
    const peekElement = document.getElementById(`peek-${book.id}`);
    if (!peekElement || peekElement.dataset.loaded) return;

    peekElement.textContent = 'Loading preview...';

    try {
        let text;

        if (book.file.startsWith('stored:')) {
            const bookId = book.file.replace('stored:', '');
            text = localStorage.getItem(`book_${bookId}`);
            if (!text) {
                peekElement.textContent = 'Preview unavailable';
                return;
            }
        } else {
            const response = await fetch(book.file);
            if (!response.ok) {
                peekElement.textContent = 'Preview unavailable';
                return;
            }
            text = await response.text();
        }

        const preview = text.trim().substring(0, 200);
        peekElement.textContent = `"${preview}"`;
        peekElement.dataset.loaded = 'true';
    } catch (error) {
        peekElement.textContent = 'Preview unavailable';
    }
};