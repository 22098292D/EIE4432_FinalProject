// Function to format dates from yyyy/mm/dd to a more readable format
function formatDate(dateString) {
  if (!dateString || dateString === 'yyyy/mm/dd') return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Function to create a user card
function createUserCard(user) {
  return `
    <div class="col-md-4 mb-4">
      <div class="card h-100 shadow-sm">
        <div class="card-header bg-primary text-white">
          <h6 class="mb-0">User Profile</h6>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <h6 class="text-muted mb-2">User Info</h6>
            <div>
              <strong>ID:</strong>
              <h5 class="card-title d-inline mb-0">${user.userID}</h5>
            </div>
            <div>
              <strong>Nickname:</strong>
              <span>${user.nickname || 'No nickname'}</span>
            </div>
          </div>
          <div class="card-text">
            <div class="mb-2">
              <strong><i class="bi bi-envelope"></i> Email:</strong>
              <p class="mb-1">${user.email}</p>
            </div>
            <div class="mb-2">
              <strong><i class="bi bi-person"></i> Gender:</strong>
              <p class="mb-1">${user.gender || 'Unspecified'}</p>
            </div>
            <div class="mb-2">
              <strong><i class="bi bi-calendar"></i> Birth Date:</strong>
              <p class="mb-1">${formatDate(user.birthdate)}</p>
            </div>
          </div>
          <div class="mt-3">
            <a href="managePage3-user.html?userId=${user.userID}" class="btn btn-primary btn-sm">View Details</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to display users
async function displayUsers(users) {
  const userContainer = document.getElementById('userContainer');
  userContainer.innerHTML = '';

  if (users.length === 0) {
    userContainer.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted">No users found</p>
      </div>
    `;
    return;
  }

  users.forEach((user) => {
    userContainer.innerHTML += createUserCard(user);
  });
}

// Function to fetch all users
async function fetchUsers() {
  try {
    console.log('Fetching users...');
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received users:', data);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function handleSearch() {
  const searchInput = document.getElementById('userSearchInput');
  const clearButton = document.getElementById('clearButton');
  const userId = searchInput.value.trim();

  try {
    if (userId) {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const user = await response.json();
        displayUsers([user]);
        clearButton.style.display = 'block'; // 显示清除按钮
      } else {
        displayUsers([]);
        clearButton.style.display = 'block'; // 即使没找到用户也显示清除按钮
      }
    } else {
      const users = await fetchUsers();
      displayUsers(users);
      clearButton.style.display = 'none'; // 如果搜索框为空，隐藏清除按钮
    }
  } catch (error) {
    console.error('Error searching users:', error);
    displayUsers([]);
  }
}

// Function to handle clear filter
async function handleClear() {
  const searchInput = document.getElementById('userSearchInput');
  const clearButton = document.getElementById('clearButton');

  searchInput.value = ''; // 清空搜索框
  clearButton.style.display = 'none'; // 隐藏清除按钮

  const users = await fetchUsers(); // 重新获取所有用户
  displayUsers(users);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Set up search button listener
  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', handleSearch);

  // Set up clear button listener
  const clearButton = document.getElementById('clearButton');
  clearButton.addEventListener('click', handleClear);

  // Set up search input enter key listener
  const searchInput = document.getElementById('userSearchInput');
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // Load all users initially
  const users = await fetchUsers();
  displayUsers(users);
});
// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  // Set up search button listener
  document.getElementById('searchButton').addEventListener('click', handleSearch);

  // Set up search input enter key listener
  document.getElementById('userSearchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  // Load all users initially
  const users = await fetchUsers();
  displayUsers(users);
});
