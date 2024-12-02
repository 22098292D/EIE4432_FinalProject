class MovieSessionManager {
  constructor() {
    this.movies = null;
    this.sessionCounter = 1;
    this.init();
  }
  async getMaxId() {
    try {
      const response = await fetch('/events/maxId'); // 新增一个路由来获取最大ID
      const data = await response.json();
      return data.maxId + 1;
    } catch (error) {
      console.error('Error getting max ID:', error);
      return 1; // 如果出错则返回默认值
    }
  }
  async init() {
    const response = await fetch('/events/maxId');
    const data = await response.json();
    this.sessionCounter = data.maxId + 1;
    console.log('Initial sessionCounter:', this.sessionCounter); // 调试日志
    // 初始化现有卡片的编辑功能
    document.querySelectorAll('.movie-session-card').forEach((card) => {
      this.setupCardButtons(card);
    });

    // 添加"Add New Session"按钮的点击事件
    const addButton = document.querySelector('.btn-primary.rounded-pill');
    if (addButton) {
      addButton.addEventListener('click', () => this.addNewSession());
    }

    // 设置拖放功能
    this.setupDragAndDrop();
    this.setupFilters();
  }

  setupFilters() {
    // 获取筛选元素
    const dateFilter = document.getElementById('dateSelect');
    const venueFilter = document.getElementById('venueSelect');
    const searchInput = document.querySelector('.filter-container input[type="text"]');
    const titleCheckbox = document.getElementById('searchTitle');
    const descriptionCheckbox = document.getElementById('searchDescription');
    const searchButton = document.getElementById('searchButton');

    if (!dateFilter || !venueFilter || !searchInput || !titleCheckbox || !descriptionCheckbox || !searchButton) {
      console.error('Some filter elements are missing');
      return;
    }

    // 创建Clear Filters按钮
    const buttonContainer = searchButton.parentElement;
    let clearButton = document.getElementById('clearFiltersBtn');

    if (!clearButton) {
      clearButton = document.createElement('button');
      clearButton.className = 'btn btn-outline-secondary w-100 mt-2';
      clearButton.textContent = 'Clear Filters';
      clearButton.id = 'clearFiltersBtn';
      clearButton.style.display = 'none';
      buttonContainer.appendChild(clearButton);
    }

    // 只设置搜索按钮和清除按钮的点击事件
    clearButton.onclick = () => this.clearFilters();
    searchButton.onclick = () => {
      this.applyFilters();
      this.updateClearButtonVisibility();
    };

    // 复选框逻辑
    [titleCheckbox, descriptionCheckbox].forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        if (!titleCheckbox.checked && !descriptionCheckbox.checked) {
          titleCheckbox.checked = true;
        }
      });
    });

    // 设置默认值
    titleCheckbox.checked = true;
    descriptionCheckbox.checked = false;
  }

  applyFilters() {
    const dateFilter = document.getElementById('dateSelect');
    const venueFilter = document.getElementById('venueSelect');
    const searchInput = document.querySelector('.filter-container input[type="text"]');
    const titleCheckbox = document.getElementById('searchTitle');
    const descriptionCheckbox = document.getElementById('searchDescription');

    if (!dateFilter || !venueFilter || !searchInput || !titleCheckbox || !descriptionCheckbox) {
      console.error('Filter elements not found');
      return;
    }

    const dateValue = dateFilter.value;
    const venueValue = venueFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    const searchInTitle = titleCheckbox.checked;
    const searchInDescription = descriptionCheckbox.checked;

    // 搜索验证
    if (searchTerm && !searchInTitle && !searchInDescription) {
      alert('Please select at least one search option (Title or Description)');
      return;
    }

    const cards = document.querySelectorAll('.movie-session-card');
    let hasMatches = false;

    cards.forEach((card) => {
      let matches = true;

      // 获取卡片数据
      const cardDate = card.querySelector('input[type="date"]')?.value;
      const cardVenue = card.querySelector('select')?.value;
      const cardTitle = card.querySelector('input[type="text"]:not([type="file"])')?.value.toLowerCase();
      const cardDescription = card.querySelector('textarea')?.value.toLowerCase();

      // 应用过滤器
      if (dateValue && cardDate !== dateValue) matches = false;
      if (venueValue && cardVenue !== venueValue) matches = false;
      if (searchTerm) {
        const titleMatch = searchInTitle && cardTitle?.includes(searchTerm);
        const descriptionMatch = searchInDescription && cardDescription?.includes(searchTerm);
        if (!(titleMatch || descriptionMatch)) matches = false;
      }

      // 显示/隐藏卡片
      card.style.display = matches ? '' : 'none';
      if (matches) hasMatches = true;
    });

    this.showSearchResults(hasMatches);
  }

  clearFilters() {
    const dateFilter = document.getElementById('dateSelect');
    const venueFilter = document.getElementById('venueSelect');
    const searchInput = document.querySelector('.filter-container input[type="text"]');
    const titleCheckbox = document.getElementById('searchTitle');
    const descriptionCheckbox = document.getElementById('searchDescription');
    const clearButton = document.getElementById('clearFiltersBtn');

    // 重置所有筛选条件
    if (dateFilter) dateFilter.value = '';
    if (venueFilter) venueFilter.value = '';
    if (searchInput) searchInput.value = '';
    if (titleCheckbox) titleCheckbox.checked = true;
    if (descriptionCheckbox) descriptionCheckbox.checked = false;

    // 显示所有卡片
    document.querySelectorAll('.movie-session-card').forEach((card) => {
      card.style.display = '';
    });

    // 隐藏搜索结果消息
    const resultsMsg = document.querySelector('.search-results-message');
    if (resultsMsg) {
      resultsMsg.style.display = 'none';
    }

    // 隐藏Clear按钮
    if (clearButton) {
      clearButton.style.display = 'none';
    }
  }

  updateClearButtonVisibility() {
    const dateValue = document.getElementById('dateSelect')?.value;
    const venueValue = document.getElementById('venueSelect')?.value;
    const searchTerm = document.querySelector('.filter-container input[type="text"]')?.value;
    const clearButton = document.getElementById('clearFiltersBtn');

    if (clearButton) {
      clearButton.style.display = dateValue || venueValue || searchTerm.trim() ? 'block' : 'none';
    }
  }

  showSearchResults(hasMatches) {
    // 首先检查是否已存在结果消息元素
    let resultsMsg = document.querySelector('.search-results-message');

    // 如果消息元素不存在，创建一个
    if (!resultsMsg) {
      resultsMsg = document.createElement('div');
      resultsMsg.className = 'search-results-message alert mt-3';

      // 找到电影卡片容器
      const cardsContainer = document.getElementById('movieSessionCards');

      // 如果找到容器，将消息插入到容器的开头
      if (cardsContainer) {
        cardsContainer.insertBefore(resultsMsg, cardsContainer.firstChild);
      } else {
        // 如果找不到卡片容器，将消息插入到筛选容器后面
        const filterContainer = document.querySelector('.filter-container');
        if (filterContainer) {
          filterContainer.parentNode.insertBefore(resultsMsg, filterContainer.nextSibling);
        }
      }
    }

    if (!hasMatches) {
      // 没有找到匹配结果
      resultsMsg.className = 'search-results-message alert alert-warning mt-3';
      resultsMsg.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
          <span>No matching sessions found. Please try different search criteria.</span>
          <button class="btn btn-outline-secondary btn-sm" onclick="movieManager.clearFilters()">
            Clear Filters
          </button>
        </div>
      `;
      resultsMsg.style.display = 'block';
    } else {
      // 找到匹配结果，隐藏消息
      resultsMsg.style.display = 'none';
    }
  }

  async addNewSession(event) {
    // Prevent form submission if event exists
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Find or create the cards container
    let cardsContainer = document.getElementById('movieSessionCards');
    if (!cardsContainer) {
      cardsContainer = document.createElement('div');
      cardsContainer.id = 'movieSessionCards';
      const filterContainer = document.querySelector('.filter-container');
      if (filterContainer) {
        filterContainer.parentNode.insertBefore(cardsContainer, filterContainer.nextSibling);
      }
    }

    try {
      // Make API request to add new session
      const response = await fetch('/auth/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          index: this.sessionCounter,
          movieTitle: 'Untitled Movie',
          director: '',
          venue: 'A',
          description: 'No description available.',
          firstClassPrice: 100,
          secondClassPrice: 80,
          showDate: new Date().toISOString().split('T')[0],
          startTime: '00:00',
          endTime: '23:59',
          imageUrl: 'img/default-poster.jpg',
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        // Create new card
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = this.createMovieSessionCard();
        const newCard = tempContainer.firstElementChild;

        // Add card to container
        if (cardsContainer.firstChild) {
          cardsContainer.insertBefore(newCard, cardsContainer.firstChild);
        } else {
          cardsContainer.appendChild(newCard);
        }

        // Set initial state for inputs and buttons
        const inputs = newCard.querySelectorAll('input:not([type="hidden"]), textarea, select');
        inputs.forEach((input) => (input.disabled = true));

        // Configure buttons
        const editBtn = newCard.querySelector('.btn-primary');
        const saveBtn = newCard.querySelector('.btn-success');
        const seatsBtn = newCard.querySelector('.btn-warning');

        if (editBtn && saveBtn && seatsBtn) {
          editBtn.style.display = 'inline-block';
          saveBtn.style.display = 'none';
          seatsBtn.style.display = 'none';
        }
        // Setup additional functionality
        this.setupCardButtons(newCard);
        this.setupDragAndDrop();
        alert('New session added successfully');
      } else {
        throw new Error(result.message || 'Failed to add session');
      }
    } catch (error) {
      console.error('Add session error:', error);
      //alert(error.message || 'Error adding new session');
    }

    return false; // Prevent form submission
  }
  createMovieSessionCard() {
    const index = parseInt(this.sessionCounter);
    const today = new Date().toISOString().split('T')[0];
    console.log('Creating card with index:', index);
    return `
        <div class="card mb-4 shadow-sm movie-session-card" data-id="${index}">
          <div class="card-body">
              <form id="updateForm${index}" action="/auth/eventupdate" method="POST">
                  <input type="hidden" name="index" value="${index}">
                    <div class="row g-3">
                      <div class="col-12">
                          <div class="d-flex align-items-center gap-3">
                              <div style="width: 150px; height: 200px;" class="border rounded overflow-hidden position-relative">
                                  <img id="preview${index}" src="/api/placeholder/150/200" alt="Movie poster" class="w-100 h-100 object-fit-cover">
                                  <div id="loading${index}" class="position-absolute top-0 start-0 w-100 h-100 bg-light align-items-center justify-content-center" style="display: none;">
                                      <div class="spinner-border text-primary" role="status">
                                          <span class="visually-hidden">Loading...</span>
                                      </div>
                                  </div>
                              </div>
                              <div class="flex-grow-1">
                                  <label class="form-label fw-bold">Movie Poster:</label>
                                  <input type="file" class="form-control" accept="image/*" 
                                      onchange="movieManager.handleImageUpload(this, 'preview${index}', 'loading${index}')" 
                                      id="imageUpload${index}" disabled>
                                  <input type="hidden" name="imageUrl" value="img/default-poster.jpg">
                                  <small class="text-muted d-block mt-1">Recommended size: 150x200px</small>
                                  <small class="text-muted d-block">Supported formats: JPG, PNG, WebP</small>
                              </div>
                          </div>
                      </div>

                      <!-- 电影信息输入区域 -->
                      <div class="col-md-6">
                          <label class="form-label fw-bold">Movie Title:</label>
                          <input type="text" class="form-control" name="movieTitle" value="Untitled Movie"disabled>
                      </div>
                      <div class="col-md-6">
                          <label class="form-label fw-bold">Director:</label>
                          <input type="text" class="form-control" name="director" value=""disabled>
                      </div>

                      <div class="col-md-6">
                          <label class="form-label fw-bold">Venue:</label>
                          <select class="form-select" name="venue" disabled>
                              <option value="">Select Venue</option>
                              <option value="A" selected>Hall A</option>
                              <option value="B">Hall B</option>
                              <option value="C">Hall C</option>
                          </select>
                      </div>

                      <div class="col-12">
                          <label class="form-label fw-bold">Movie Description:</label>
                          <textarea class="form-control" rows="3" name="description" 
                              placeholder="Enter movie description..." disabled>No description available.</textarea>
                      </div>

                      <div class="col-md-6">
                          <label class="form-label fw-bold">First Class Price:</label>
                          <input type="number" class="form-control" name="firstClassPrice" value="100"disabled>
                      </div>

                      <div class="col-md-6">
                          <label class="form-label fw-bold">Second Class Price:</label>
                          <input type="number" class="form-control" name="secondClassPrice" value="80"disabled>
                      </div>

                      <div class="col-md-6">
                          <label class="form-label fw-bold">Date:</label>
                          <input type="date" class="form-control" name="showDate" value="${today}"disabled>
                      </div>

                      <div class="col-md-6">
                          <label class="form-label fw-bold">Time:</label>
                          <div class="input-group">
                              <input type="time" class="form-control" name="startTime" value="00:00"disabled>
                              <span class="input-group-text">-</span>
                              <input type="time" class="form-control" name="endTime" value="23:59"disabled>
                          </div>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-end gap-2 mt-4">
                      <button type="button" class="btn btn-primary" onclick="movieManager.toggleEdit(this)">
                          Edit
                      </button>
                      <button type="button" class="btn btn-warning" 
                              onclick="window.location.href='/manageMap/<%= event._id %>'" 
                              id="<%= event._id %>" >
                          Manage Seats
                      </button>
                      <button type="submit" class="btn btn-success" style="display: none;"
                              onclick="return movieManager.handleSave(this,event)">
                          Save Changes
                      </button>
                      <form action="/auth/delete" method="POST" class="d-inline">
                          <input type="hidden" name="index" value="<%= event._id %>">
                          <button type="submit" class="btn btn-danger" 
                                  onclick="return movieManager.deleteSession(this,event)">
                              Delete
                          </button>
                      </form>
                    </div>
              </form>

              <!-- 按钮组 -->
              
              
          </div>
        </div>
        `;
  }
  async handleSave(button, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const form = button.closest('form');
    const card = button.closest('.card');

    // 临时启用所有字段以收集数据
    const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
    inputs.forEach((input) => (input.disabled = false));

    // 验证 index
    const indexInput = form.querySelector('input[name="index"]');
    const index = parseInt(indexInput.value);

    if (isNaN(index)) {
      alert('Invalid index value');
      return false;
    }

    // 收集并验证表单数据
    const formData = new FormData(form);
    const hasEmptyFields = Array.from(formData.entries()).some(([key, value]) => !value && key !== 'director');

    if (hasEmptyFields) {
      alert('Please fill in all required fields');
      // 保持字段可编辑状态
      return false;
    }

    if (!confirm('Save changes?')) {
      // 如果用户取消保存，保持字段可编辑状态
      return false;
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Changes saved successfully');
        // 只有在成功保存后才切换回非编辑状态
        this.toggleEdit(button);
      } else {
        throw new Error(data.message || 'Save failed');
      }
    } catch (error) {
      alert(error.message || 'Error saving changes');
      // 保持字段可编辑状态
    }

    return false;
  }
  async deleteSession(button, event) {
    if (event) {
      event.preventDefault();
    }

    if (!confirm('Are you sure you want to delete this session?')) {
      return false;
    }

    try {
      const card = button.closest('.movie-session-card');
      const index = button.closest('form').querySelector('input[name="index"]').value;

      const response = await fetch('/auth/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ index: index }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        alert('Session deleted successfully');
        card.remove();
      } else {
        throw new Error(data.message || 'Delete failed');
      }
    } catch (error) {
      alert(error.message || 'Error deleting session');
    }

    return false;
  }

  toggleEdit(button) {
    const card = button.closest('.card');
    const inputs = card.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const editBtn = card.querySelector('.btn-primary'); // Edit 按钮
    const saveBtn = card.querySelector('.btn-success'); // Save Changes 按钮
    const seatsBtn = card.querySelector('.btn-warning'); // Manage Seats 按钮
    const fileInput = card.querySelector('input[type="file"]');

    if (button.classList.contains('btn-primary')) {
      // 如果点击的是 Edit 按钮
      // 启用编辑
      inputs.forEach((input) => (input.disabled = false));
      if (fileInput) fileInput.disabled = false;

      // 显示/隐藏按钮
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
      seatsBtn.style.display = 'none';
    } else if (button.classList.contains('btn-success')) {
      // 如果点击的是 Save Changes 按钮
      // 禁用所有字段
      inputs.forEach((input) => (input.disabled = true));
      if (fileInput) fileInput.disabled = true;

      // 更新按钮显示状态
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      seatsBtn.style.display = 'inline-block';
    }
  }

  setupCardButtons(card) {
    const editBtn = card.querySelector('.btn-primary'); // Edit 按钮
    const saveBtn = card.querySelector('.btn-success'); // Save Changes 按钮
    const seatsBtn = card.querySelector('.btn-warning'); // Manage Seats 按钮

    if (editBtn && saveBtn && seatsBtn) {
      // 设置初始状态
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      seatsBtn.style.display = 'inline-block';

      // 为按钮添加点击事件监听器
      editBtn.addEventListener('click', () => this.toggleEdit(editBtn));
    }
  }

  // 调整图片大小
  resizeImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const targetWidth = 150;
        const targetHeight = 200;

        let scale = Math.min(targetWidth / img.width, targetHeight / img.height);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (targetWidth - scaledWidth) / 2;
        const offsetY = (targetHeight - scaledHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );

        URL.revokeObjectURL(img.src);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(img.src);
      };
    });
  }
  async handleImageUpload(input, previewId, loadingId) {
    const preview = document.getElementById(previewId);
    const loading = document.getElementById(loadingId);
    const card = input.closest('.card');

    if (input.files && input.files[0]) {
      try {
        loading.style.display = 'flex';
        const file = input.files[0];

        // Check file size
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error('Image size should not exceed 5MB');
        }

        // Resize image
        const resizedBlob = await this.resizeImage(file);

        // Create local preview
        const previewUrl = URL.createObjectURL(resizedBlob);
        preview.onload = () => {
          URL.revokeObjectURL(preview.src);
        };
        preview.src = previewUrl;

        // Prepare upload data
        const formData = new FormData();
        formData.append('image', resizedBlob, file.name);

        // Upload to server
        const response = await fetch('/auth/upload', {
          method: 'POST',
          body: formData,
          // 添加credentials确保会发送cookie
          credentials: 'same-origin',
        });

        // 检查响应状态
        if (!response.ok) {
          if (response.status === 401) {
            alert('Session expired, please login again');
            window.location.href = '/login'; // 重定向到登录页
            return;
          }
          //throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server response was not JSON');
        }

        const result = await response.json();

        if (result.status === 'success') {
          // Update image with server path
          preview.src = result.path;

          // Save image path to hidden input
          let imageUrlInput = card.querySelector('input[name="imageUrl"]');
          if (!imageUrlInput) {
            imageUrlInput = document.createElement('input');
            imageUrlInput.type = 'hidden';
            imageUrlInput.name = 'imageUrl';
            card.querySelector('form').appendChild(imageUrlInput);
          }
          imageUrlInput.value = result.path;
        } else {
          throw new Error(result.message || 'Upload failed');
        }

        loading.style.display = 'none';
      } catch (error) {
        loading.style.display = 'none';
        console.error('Upload error:', error);
        alert(error.message || 'Error processing image. Please try again.');

        // 如果出错，恢复input的值
        input.value = '';
        // 如果有默认图片路径，恢复默认图片
        const defaultImageUrl = card.querySelector('input[name="imageUrl"]')?.value || 'img/default-poster.jpg';
        preview.src = defaultImageUrl;
      }
    }
  }
  // 处理图片上传

  // 设置拖放功能
  setupDragAndDrop() {
    const dropZones = document.querySelectorAll('.border.rounded.overflow-hidden');

    dropZones.forEach((zone, index) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#0d6efd';
        zone.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
      });

      zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        zone.style.backgroundColor = '';
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '';
        zone.style.backgroundColor = '';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
          const input = document.getElementById(`imageUpload${index + 1}`);
          if (!input.disabled) {
            // 只有在编辑模式下才允许上传
            input.files = files;
            input.dispatchEvent(new Event('change'));
          }
        }
      });
    });
  }
}

// 创建全局实例并在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.movieManager = new MovieSessionManager();
});
