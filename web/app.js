let booksData = [];
let currentFilter = 'Todos';
let currentSearch = '';
let selectedBookId = null;

const API_URL = '/api/livros';

// DOM Elements
const booksGrid = document.getElementById('booksGrid');
const filtersContainer = document.getElementById('filtersContainer');
const searchInput = document.getElementById('searchInput');

// Modal Elements
const modal = document.getElementById('bookModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const deleteBookBtn = document.getElementById('deleteBookBtn');

// Inicialização
async function init() {
    await fetchBooks();
    setupEventListeners();
}

// Busca livros da API
async function fetchBooks() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            booksData = await response.json();
            renderFilters();
            renderBooks();
        } else {
            console.error('Falha ao buscar livros.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Renderiza botões de filtro
function renderFilters() {
    filtersContainer.innerHTML = '';
    const allGenres = booksData.map(book => book.genero);
    const uniqueGenres = ['Todos', ...new Set(allGenres)];

    uniqueGenres.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${currentFilter === genre ? 'active' : ''}`;
        btn.textContent = genre;
        btn.onclick = () => {
            currentFilter = genre;
            renderFilters();
            renderBooks();
        };
        filtersContainer.appendChild(btn);
    });
}

// Renderiza a grade de livros
function renderBooks() {
    booksGrid.innerHTML = '';
    
    const filtered = booksData.filter(book => {
        const matchesSearch = 
            book.titulo.toLowerCase().includes(currentSearch.toLowerCase()) ||
            book.autor.toLowerCase().includes(currentSearch.toLowerCase()) ||
            book.palavrasChave.some(kw => kw.toLowerCase().includes(currentSearch.toLowerCase()));
        
        const matchesGenre = currentFilter === 'Todos' || book.genero === currentFilter;
        
        return matchesSearch && matchesGenre;
    });

    if (filtered.length === 0) {
        booksGrid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <h3>Nenhum resultado encontrado</h3>
                <p>O termo pesquisado não consta em nosso acervo.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(book => {
        const card = document.createElement('div');
        card.className = 'book-card';
        
        const tagsHtml = `
            <span class="tag tag-primary">
                ${book.genero}
            </span>
            ${book.palavrasChave.slice(0, 2).map(kw => `<span class="tag">${kw}</span>`).join('')}
        `;

        card.innerHTML = `
            <div class="card-header">
                <h3 class="book-title">${book.titulo}</h3>
                <p class="book-author">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ${book.autor}
                </p>
            </div>
            <div class="card-body">
                <div class="book-meta">
                    <span class="book-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        ${book.anoPublicacao}
                    </span>
                    <span class="book-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-small"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        ${book.paginas} páginas
                    </span>
                </div>
                <div class="tags">
                    ${tagsHtml}
                </div>
            </div>
            <div class="card-footer">
                <button class="btn-primary" onclick="openModal('${book.id}')">Acessar Registro</button>
            </div>
        `;
        booksGrid.appendChild(card);
    });
}

// Gerencia Modal
window.openModal = function(id) {
    const book = booksData.find(b => b.id === id);
    if (!book) return;

    selectedBookId = id;
    
    document.getElementById('modalTitle').textContent = book.titulo;
    document.getElementById('modalAuthor').textContent = book.autor;
    document.getElementById('modalSynopsis').textContent = book.sinopse;
    document.getElementById('modalGenre').textContent = book.genero;
    document.getElementById('modalYear').textContent = book.anoPublicacao;
    document.getElementById('modalPages').textContent = book.paginas;
    
    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = book.palavrasChave.map(kw => `<span class="tag" style="margin:0">${kw}</span>`).join('');
    
    modal.style.display = 'flex';
};

function closeModal() {
    modal.style.display = 'none';
    selectedBookId = null;
}

// Excluir Livro
async function deleteBook() {
    if (!selectedBookId) return;
    
    if (confirm('Tem certeza que deseja remover esta obra do acervo?')) {
        try {
            const response = await fetch(`${API_URL}/${selectedBookId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                closeModal();
                await fetchBooks();
            } else {
                alert('Erro ao excluir registro.');
            }
        } catch (error) {
            console.error('Erro ao deletar:', error);
            alert('Erro de rede ao tentar remover a obra.');
        }
    }
}

// Event Listeners
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderBooks();
    });

    closeModalBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    deleteBookBtn.addEventListener('click', deleteBook);
}

// Start
init();
