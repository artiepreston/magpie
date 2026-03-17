---
title: Stock List
layout: 'layouts/mainLayout.njk'
eleventyNavigation:
  key: Our Stock
  order: 3
---
# Our Stock

Below is a list of the books we currently have in stock. Feel free to give us an email or reach out on instagram if you have any questions, or want us to put a book aside for you.

Please note that we can't guarentee the cover shown is the exact same as the one we have in our stock - if you're looking for a particular edition then reach out!

All books are secondhand.

<div id="search-bar">
  <input type="text" id="search" placeholder="Search by title or author..." />
</div>

<div id="book-grid"></div>

<div id="pagination">
  <button id="prev"><span>Previous</span></button>
  <span id="page-info"></span>
  <button id="next"><span>Next</span></button>
</div>

<script>
  const books = {{ books | dump | safe }};
  const PAGE_SIZE = 40;
  let currentPage = 0;
  let filtered = books;

  const grid = document.getElementById('book-grid');
  const pageInfo = document.getElementById('page-info');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');

  function render() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const start = currentPage * PAGE_SIZE;
    const page = filtered.slice(start, start + PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    grid.innerHTML = page.map(book => `
      <div class="book-card">
        ${book.cover
          ? `<img src="${book.cover}" alt="Cover of ${book.title}" />`
          : `<img src="/public/images/no_img.png"/>`
        }
        <div class="book-card-body">
          <h3>${book.title}</h3>
          <p class="author">${book.author}</p>
          <span class="condition">Condition: ${book.condition}</span>
        </div>
      </div>
    `).join('');

    pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  document.getElementById('search').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    filtered = books.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
    currentPage = 0;
    render();
  });

  prevBtn.addEventListener('click', () => { currentPage--; render(); });
  nextBtn.addEventListener('click', () => { currentPage++; render(); });

  render();
</script>