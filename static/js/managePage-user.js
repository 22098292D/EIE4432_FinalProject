function formatBookingTime(timeString) {
  return new Date(timeString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getUserIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('userId');
}
async function fetchBookingHistory(userId) {
  try {
    const response = await fetch(`/api/user-bookings/${userId}`);
    const data = await response.json();

    if (data.status === 'success') {
      return data.bookings;
    } else {
      console.error('Error fetching bookings:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
function formatDate(dateString) {
  if (!dateString || dateString === 'yyyy/mm/dd') return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function displayUserInfo(user) {
  document.getElementById('displayUserId').textContent = user.userID;
  document.getElementById('displayNickname').textContent = user.nickname || 'Not specified';
  document.getElementById('displayEmail').textContent = user.email || 'Not specified';
  document.getElementById('displayGender').textContent = user.gender || 'Unspecified';
  document.getElementById('displayBirthdate').textContent = formatDate(user.birthdate);
}

function displayBookingHistory(bookings) {
  const container = document.querySelector('.booking-history-container');

  if (!bookings || bookings.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">No booking history found</div>';
    return;
  }

  container.innerHTML = ''; // 清除现有内容

  bookings.forEach((booking) => {
    const bookingCard = `
      <div class="card mb-3 shadow-sm">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-2">
              <div class="text-muted mb-1">UserId:</div>
              <strong>${booking.userId}</strong>
            </div>
            <div class="col-md-3">
              <h5 class="card-title mb-0">${booking.movieTitle}</h5>
              <span class="badge bg-primary">${booking.ticketClass}</span>
            </div>
            <div class="col-md-2">
              <div class="text-muted mb-1">${booking.date}</div>
              <div class="text-muted">${booking.time}</div>
            </div>
            <div class="col-md-3">
              <div class="text-muted mb-1">Venue: ${booking.venue}</div>
              <div class="text-muted">Seat: ${booking.seat}</div>
              <div class="text-muted small">Booked: ${formatBookingTime(booking.bookingTime)}</div>
            </div>
            <div class="col-md-2 text-end">
              <h5 class="text-primary mb-0">$${booking.price.toFixed(2)}</h5>
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += bookingCard;
  });
}

async function fetchAndDisplayUserDetails() {
  const userId = getUserIdFromUrl();
  if (!userId) {
    alert('User ID not found in URL');
    return;
  }

  try {
    const container = document.querySelector('.booking-history-container');
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;

    const response = await fetch(`/api/user-details/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const data = await response.json();
    displayUserInfo(data.user);

    const bookings = await fetchBookingHistory(userId);
    displayBookingHistory(bookings);
  } catch (error) {
    console.error('Error:', error);
    document.querySelector('.booking-history-container').innerHTML = `
      <div class="alert alert-danger" role="alert">
        Error loading user details and booking history
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplayUserDetails();
});
