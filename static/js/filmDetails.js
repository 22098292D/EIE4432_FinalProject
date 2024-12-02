let suggestionBox = null;

function createSuggestionBox() {
  if (!suggestionBox) {
    suggestionBox = document.createElement('div');
    suggestionBox.className = 'dropdown-menu w-100 shadow-sm p-0 m-0';
    suggestionBox.setAttribute('role', 'listbox');
    suggestionBox.style.cssText = `
      position: absolute;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1050;
      display: none;
    `;
  }
  return suggestionBox;
}

function initializeSearchListeners() {
  const searchButton = document.querySelector('#searchButton');
  const clearButton = document.querySelector('#clearFiltersBtn');
  const searchInput = document.querySelector('input[type="text"]');
  const searchTitleCheckbox = document.getElementById('searchTitle');
  const searchDescriptionCheckbox = document.getElementById('searchDescription');
  const dateSelect = document.getElementById('dateSelect');
  const venueSelect = document.getElementById('venueSelect');

  // 设置自动完成功能
  const searchContainer = searchInput.parentElement;
  searchContainer.style.position = 'relative';
  const suggestionBox = createSuggestionBox();
  searchContainer.appendChild(suggestionBox);

  // Search 按钮点击事件
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      updateClearButtonVisibility();
      filterMovies();
    });
  }

  // Clear Filters 按钮事件
  if (clearButton) {
    clearButton.addEventListener('click', clearFilters);
  }

  // 复选框逻辑：至少选中一个
  searchTitleCheckbox.checked = true; // 默认选中标题搜索
  [searchTitleCheckbox, searchDescriptionCheckbox].forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (!searchTitleCheckbox.checked && !searchDescriptionCheckbox.checked) {
        searchTitleCheckbox.checked = true;
      }
    });
  });

  // 监听筛选条件变化
  [dateSelect, venueSelect, searchInput].forEach((element) => {
    element.addEventListener('change', () => {});
    element.addEventListener('keyup', () => {});
  });

  // 添加自动完成功能
  let debounceTimeout;
  searchInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value.trim();

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    updateClearButtonVisibility();

    if (searchTerm.length < 1) {
      suggestionBox.style.display = 'none';
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/search-suggestions?term=${encodeURIComponent(searchTerm)}`);
        const suggestions = await response.json();

        if (suggestions.length > 0) {
          suggestionBox.innerHTML = suggestions
            .map((suggestion) => {
              const truncatedText = suggestion.text.length > 22 ? suggestion.text.substring(0, 22) : suggestion.text;

              return `
            <button type="button" 
                    class="dropdown-item d-flex align-items-center py-2 px-3 border-bottom" 
                    role="option"
                    style="text-overflow: clip !important; 
                           overflow: hidden !important; 
                           white-space: nowrap !important;">
              <div class="me-2">
                <i class="bi ${suggestion.type === 'title' ? 'bi-film' : 'bi-card-text'}"></i>
              </div>
              <div class="flex-grow-1" style="text-overflow: clip !important; 
                                            overflow: hidden !important;
                                            white-space: nowrap !important;">
                ${highlightMatch(truncatedText, searchTerm)}
              </div>
            </button>
          `;
            })
            .join('');

          suggestionBox.style.display = 'block';

          suggestionBox.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener('click', () => {
              const truncatedText =
                suggestions[index].text.length > 22
                  ? suggestions[index].text.substring(0, 22)
                  : suggestions[index].text;
              searchInput.value = truncatedText;
              suggestionBox.style.display = 'none';
            });
          });
        } else {
          suggestionBox.innerHTML = `
            <div class="dropdown-item text-muted py-2 px-3">
              No matches found
            </div>
          `;
          suggestionBox.style.display = 'block';
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300);
  });

  // 添加键盘导航支持
  searchInput.addEventListener('keydown', (e) => {
    const items = suggestionBox.querySelectorAll('.dropdown-item');
    const activeItem = suggestionBox.querySelector('.dropdown-item.active');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!activeItem) {
          items[0]?.classList.add('active');
        } else {
          activeItem.classList.remove('active');
          activeItem.nextElementSibling?.classList.add('active');
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (activeItem) {
          activeItem.classList.remove('active');
          activeItem.previousElementSibling?.classList.add('active');
        }
        break;

      case 'Enter':
        if (activeItem) {
          e.preventDefault();
          activeItem.click();
        }
        break;

      case 'Escape':
        suggestionBox.style.display = 'none';
        break;
    }
  });

  // 点击外部时隐藏建议框
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      suggestionBox.style.display = 'none';
    }
  });
}

// 高亮匹配文本的辅助函数
function highlightMatch(text, searchTerm) {
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<span class="bg-warning">$1</span>');
}

// 清除所有筛选条件
function clearFilters() {
  document.getElementById('dateSelect').value = '';
  document.getElementById('venueSelect').value = '';
  document.querySelector('input[type="text"]').value = '';
  document.getElementById('searchTitle').checked = true;
  document.getElementById('searchDescription').checked = false;

  // 显示所有卡片
  document.querySelectorAll('.movies-container .col-lg-4').forEach((card) => {
    card.style.display = '';
  });

  // 隐藏Clear按钮
  document.querySelector('#clearFiltersBtn').style.display = 'none';

  // 移除"no results"消息
  const noResultsMsg = document.querySelector('.no-results-message');
  if (noResultsMsg) {
    noResultsMsg.remove();
  }

  // 隐藏建议框
  if (suggestionBox) {
    suggestionBox.style.display = 'none';
  }
}

// 更新Clear按钮可见性
function updateClearButtonVisibility() {
  const clearButton = document.querySelector('#clearFiltersBtn');
  clearButton.style.display = 'block'; // 移除条件判断，永远显示
}

// 过滤电影
function filterMovies() {
  const dateFilter = document.getElementById('dateSelect').value;
  const venueFilter = document.getElementById('venueSelect').value;
  const searchText = document.querySelector('input[type="text"]').value.toLowerCase().trim();
  const searchInTitle = document.getElementById('searchTitle').checked;
  const searchInDescription = document.getElementById('searchDescription').checked;

  // 验证搜索选项
  if (searchText && !searchInTitle && !searchInDescription) {
    alert('Please select at least one search option (Title or Description)');
    document.getElementById('searchTitle').checked = true;
    return;
  }

  const cards = document.querySelectorAll('.movies-container .col-lg-4');
  let hasMatches = false;

  cards.forEach((card) => {
    const title = card.querySelector('.card-title').textContent.toLowerCase();
    const descriptionElement = card.querySelectorAll('.card-text')[4];
    const description = descriptionElement ? descriptionElement.textContent.toLowerCase() : '';
    const dateElement = card.querySelector('.card-text:nth-of-type(2)');
    const date = dateElement ? dateElement.textContent.split(': ')[1] : '';
    const venueElement = card.querySelector('.card-text:nth-of-type(4)');
    const venue = venueElement ? venueElement.textContent.split('Hall ')[1] : '';

    let matches = true;

    if (dateFilter && !date.includes(dateFilter)) matches = false;
    if (venueFilter && venue !== venueFilter) matches = false;
    if (searchText) {
      const titleMatch = searchInTitle && title.includes(searchText);
      const descriptionMatch = searchInDescription && description.includes(searchText);
      if (!(titleMatch || descriptionMatch)) matches = false;
    }

    card.style.display = matches ? '' : 'none';
    if (matches) hasMatches = true;
  });

  showNoResultsMessage(!hasMatches);
  updateClearButtonVisibility();

  if (suggestionBox) {
    suggestionBox.style.display = 'none';
  }
}

// 显示无结果消息
function showNoResultsMessage(show) {
  let messageDiv = document.querySelector('.no-results-message');
  if (show) {
    if (!messageDiv) {
      messageDiv = document.createElement('div');
      messageDiv.className = 'col-12 no-results-message';
      messageDiv.innerHTML = `
        <div class="alert alert-warning text-center" role="alert">
          No movies found matching your criteria
          <button class="btn btn-outline-secondary btn-sm ms-3" onclick="clearFilters()">
            Clear All Filters
          </button>
        </div>
      `;
      document.querySelector('.movies-container .row').prepend(messageDiv);
    }
  } else if (messageDiv) {
    messageDiv.remove();
  }
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
  initializeSearchListeners();
  // 初始隐藏Clear按钮
  const clearButton = document.querySelector('#clearFiltersBtn');
  if (clearButton) {
    clearButton.style.display = 'none';
  }
});
