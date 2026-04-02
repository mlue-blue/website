// API Base URL
const API_BASE = '/api';

// Load books from the API
let books = [];

async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`);
        if (!response.ok) {
            throw new Error('Failed to load books');
        }
        books = await response.json();
        return books;
    } catch (error) {
        console.error('Error loading books:', error);
        return [];
    }
}

// DOM Elements - will be initialized when DOM is ready
let bookGrid, searchInput, bookCount, noResults, modal, modalTitle, bookContent, closeBtn, addBookForm;

// Render books
function renderBooks(booksToRender) {
    if (!bookGrid) return;

    bookGrid.innerHTML = '';

    if (booksToRender.length === 0) {
        noResults.style.display = 'block';
        bookCount.textContent = '0';
        return;
    }

    noResults.style.display = 'none';
    bookCount.textContent = booksToRender.length;

    booksToRender.forEach((book) => {
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

// Reload books from API and render
async function reloadAndRender(searchTerm = '') {
    books = await loadBooks();
    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderBooks(filteredBooks);
}

// Load book preview on hover
async function loadPreview(book) {
    const peekElement = document.getElementById(`peek-${book.id}`);
    if (!peekElement || peekElement.dataset.loaded) return;

    peekElement.textContent = 'Loading preview...';

    try {
        const response = await fetch(`${API_BASE}/books/${book.id}/content`);
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
    if (!modal || !modalTitle || !bookContent) return;

    modalTitle.textContent = book.title;
    bookContent.innerHTML = '<div class="loading">Loading</div>';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    try {
        const response = await fetch(`${API_BASE}/books/${book.id}/content`);

        if (!response.ok) {
            throw new Error('Book file not found');
        }

        const text = await response.text();
        bookContent.innerHTML = text;
    } catch (error) {
        bookContent.innerHTML = `
            <div class="error">
                <p>Error loading book: ${error.message}</p>
            </div>
        `;
    }
}

// Close modal
function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'block') {
        closeModal();
    }
});

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    bookGrid = document.getElementById('bookGrid');
    searchInput = document.getElementById('searchInput');
    bookCount = document.getElementById('bookCount');
    noResults = document.getElementById('noResults');
    modal = document.getElementById('readingModal');
    modalTitle = document.getElementById('modalTitle');
    bookContent = document.getElementById('bookContent');
    closeBtn = document.getElementById('closeBtn');
    addBookForm = document.getElementById('addBookForm');

    // Load books and render if on main page
    if (bookGrid) {
        await reloadAndRender();
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            reloadAndRender(e.target.value);
        });
    }

    // Close button click
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on clicking outside modal
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Add Book Form Handling
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

            if (!title || !author || !year) {
                alert('Please fill in all required fields');
                return;
            }

            try {
                // Create FormData with the book file
                const formData = new FormData();
                formData.append('bookFile', bookFile);
                formData.append('title', title);
                formData.append('author', author);
                formData.append('year', year);

                // Handle cover image if provided
                if (coverFile) {
                    const coverDataUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(coverFile);
                    });
                    if (coverDataUrl) {
                        formData.append('coverData', coverDataUrl);
                    }
                }

                // Send to server
                const response = await fetch(`${API_BASE}/books`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add book');
                }

                const newBook = await response.json();
                console.log('Book added successfully:', newBook);

                // Show success message
                document.getElementById('addBookForm').style.display = 'none';
                document.getElementById('successMessage').style.display = 'block';
            } catch (error) {
                console.error('Error adding book:', error);
                alert('Error adding book: ' + error.message);
            }
        });
    }
});

// Cancel button on add-book page
document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Auto-populate title from filename
    const bookFileInput = document.getElementById('bookFile');
    if (bookFileInput) {
        bookFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const title = file.name.replace('.txt', '').replace(/[-_]/g, ' ');
                const words = title.split(' ').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
                document.getElementById('bookTitle').value = words;
            }
        });
    }
});