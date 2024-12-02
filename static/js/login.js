async function login() {
  const userID = document.getElementById('userID').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked; // 获取是否选中"记住我"

  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userID, password }),
  });

  const result = await response.json();
  if (result.status === 'success') {
    // 如果用户选择记住我，存储 userID 到 localStorage
    if (rememberMe) {
      localStorage.setItem('rememberedUserID', userID);
    } else {
      localStorage.removeItem('rememberedUserID'); // 如果未选择，移除存储的用户 ID
    }

    localStorage.setItem(
      'userInfo',
      JSON.stringify({
        id: result.user.userID,
        nickname: result.user.nickname,
        email: result.user.email,
      })
    );
    if (result.user.userID === 'admin') {
      window.location.href = '/managePage1.html';
    } else {
      window.location.href = '/userPage.html';
    }
  } else {
    alert(result.message);
  }
}
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Add new function to fetch user data by ID
async function fetchUserDataById(userId) {
  try {
    const response = await fetch(`/auth/user/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    if (result.status === 'success') {
      return result.user;
    } else {
      console.error('Failed to fetch user data:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Add initialization code for managePage3-user.html
if (window.location.pathname === '/managePage3-user.html') {
  const userId = getUrlParameter('userId');
  if (userId) {
    fetchUserDataById(userId).then((userData) => {
      if (userData) {
        // Update the page with user data
        document.getElementById('displayUserId').textContent = userData.userID;
        document.getElementById('displayNickname').textContent = userData.nickname;
        document.getElementById('displayEmail').textContent = userData.email;
        document.getElementById('displayGender').textContent = userData.gender;
        document.getElementById('displayBirthdate').textContent = userData.birthdate;
        if (userData.avatar) {
          document.getElementById('avatar').src = userData.avatar;
        }
        const voucherContainer = document.getElementById('voucherContainer');
        voucherContainer.innerHTML = `
            <span class="badge bg-secondary me-2">-10$</span> x${userData.discount[10]}
            <span class="badge bg-secondary me-2">-20$</span> x${userData.discount[20]}
            <span class="badge bg-secondary me-2">-50$</span> x${userData.discount[50]}
            <span class="badge bg-secondary me-2">Free</span> x${userData.discount.free}
        `;
      }
    });
  }
}
function formatBookingTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
async function loadBookingHistory() {
  const userId = getUrlParameter('userId');
  if (!userId) {
    console.error('No userId provided');
    const bookingsContainer = document.querySelector('.booking-history-container');
    if (bookingsContainer) {
      bookingsContainer.innerHTML = '<div class="alert alert-danger">Error: No user ID provided</div>';
    }
    return;
  }

  try {
    const response = await fetch(`/auth/bookings/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Booking response:', data);

    const bookingsContainer = document.querySelector('.booking-history-container');
    if (!bookingsContainer) {
      console.error('Booking container not found');
      return;
    }

    if (data.status === 'success' && Array.isArray(data.bookings)) {
      bookingsContainer.innerHTML =
        data.bookings.length === 0
          ? '<div class="alert alert-info">No booking history found</div>'
          : data.bookings
              .map(
                (booking) => `
          <div class="card mb-3 shadow-sm">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-2">
                  <div class="text-muted mb-1">UserId:</div>
                  <strong>${booking.userId || 'N/A'}</strong>
                </div>
                <div class="col-md-3">
                  <h5 class="card-title mb-0">${booking.movieTitle || 'N/A'}</h5>
                  <span class="badge bg-primary">${booking.ticketClass || 'N/A'}</span>
                </div>
                <div class="col-md-2">
                  <div class="text-muted mb-1">${booking.date || 'N/A'}</div>
                  <div class="text-muted">${booking.time || 'N/A'}</div>
                </div>
                <div class="col-md-3">
                  <div class="text-muted mb-1">Venue: ${booking.venue || 'N/A'}</div>
                  <div class="text-muted">Seat: ${booking.seat || 'N/A'}</div>
                  <div class="text-muted small">Booked: ${booking.bookingTime ? formatBookingTime(booking.bookingTime) : 'N/A'}</div>
                </div>
                <div class="col-md-2 text-end">
                  <h5 class="text-primary mb-0">${typeof booking.price === 'number' ? `$${booking.price.toFixed(2)}` : 'N/A'}</h5>
                </div>
              </div>
            </div>
          </div>
        `
              )
              .join('');
    } else {
      bookingsContainer.innerHTML = '<div class="alert alert-danger">Failed to load booking history</div>';
    }
  } catch (error) {
    console.error('Error loading booking history:', error);
    const bookingsContainer = document.querySelector('.booking-history-container');
    if (bookingsContainer) {
      bookingsContainer.innerHTML = '<div class="alert alert-danger">Error loading booking history</div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const rememberedUserID = localStorage.getItem('rememberedUserID');
  if (rememberedUserID) {
    document.getElementById('userID').value = rememberedUserID;
    document.getElementById('rememberMe').checked = true; // 勾选"记住我"
  }
  await loadBookingHistory();
});
