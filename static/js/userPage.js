let editMode = false;

async function toggleEdit() {
  editMode = !editMode;
  document.getElementById('displayPassword').classList.toggle('d-none', editMode);
  document.getElementById('displayNickname').classList.toggle('d-none', editMode);
  document.getElementById('displayEmail').classList.toggle('d-none', editMode);
  document.getElementById('displayGender').classList.toggle('d-none', editMode);
  document.getElementById('displayBirthdate').classList.toggle('d-none', editMode);

  document.getElementById('inputPassword').classList.toggle('d-none', !editMode);
  document.getElementById('inputNickname').classList.toggle('d-none', !editMode);
  document.getElementById('inputEmail').classList.toggle('d-none', !editMode);
  document.getElementById('inputGender').classList.toggle('d-none', !editMode);
  document.getElementById('inputBirthdate').classList.toggle('d-none', !editMode);

  document.getElementById('editButton').innerText = editMode ? 'Save' : 'Edit';

  if (!editMode) {
    // 保存数据到数据库
    const updatedUser = {
      userID: document.getElementById('displayUserId').innerText,
      password: document.getElementById('inputPassword').value,
      nickname: document.getElementById('inputNickname').value,
      email: document.getElementById('inputEmail').value,
      gender: document.getElementById('inputGender').value,
      birthdate: document.getElementById('inputBirthdate').value,
    };

    const response = await fetch('/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });

    if (response.ok) {
      alert('User information updated successfully');
      loadUserData(); // 重新加载用户数据
    } else {
      alert('Failed to update user information');
    }
  }
}

// function toggleUploadButton() {
//   const uploadButton = document.getElementById('uploadButton');
//   uploadButton.style.display = uploadButton.style.display === 'none' ? 'block' : 'none';
// }

async function loadUserData() {
  const response = await fetch('/auth/me');
  const data = await response.json();
  if (data.status === 'success') {
    const user = data.user;
    const a = user.avatar;
    const result = a.replace(/^.*\/(img\/.*)$/, '$1');
    document.getElementById('avatar').src = result || 'img/user1.png';
    document.getElementById('displayUserId').innerText = user.userID;
    document.getElementById('displayPassword').innerText = user.password;
    document.getElementById('inputPassword').value = user.password;
    document.getElementById('displayNickname').innerText = user.nickname;
    document.getElementById('inputNickname').value = user.nickname;
    document.getElementById('displayEmail').innerText = user.email;
    document.getElementById('inputEmail').value = user.email;
    document.getElementById('displayGender').innerText = user.gender;
    document.getElementById('inputGender').value = user.gender;
    document.getElementById('displayBirthdate').innerText = user.birthdate;
    document.getElementById('inputBirthdate').value = user.birthdate;

    const voucherContainer = document.getElementById('voucherContainer');
    voucherContainer.innerHTML = `
            <span class="badge bg-secondary me-2">-10$</span> x${user.discount[10]}
            <span class="badge bg-secondary me-2">-20$</span> x${user.discount[20]}
            <span class="badge bg-secondary me-2">-50$</span> x${user.discount[50]}
            <span class="badge bg-secondary me-2">Free</span> x${user.discount.free}
        `;
  } else {
    alert('Failed to load user data');
  }
}

function toggleUploadButton() {
  document.getElementById('uploadButton').style.display = 'block';
}

function triggerUpload() {
  document.getElementById('uploadAvatar').click();
}

async function uploadAvatar() {
  const fileInput = document.getElementById('uploadAvatar');
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/auth/upload-avatar', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    document.getElementById('avatar').src = data.avatar;
    alert('Avatar updated successfully');
  } else {
    alert('Failed to upload avatar');
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
  const response = await fetch('/auth/bookings');
  const data = await response.json();
  console.log('Booking response:', data);
  if (data.status === 'success') {
    const bookingsContainer = document.querySelector('.booking-history-container');
    bookingsContainer.innerHTML = ''; // Clear existing content

    data.bookings.forEach((booking) => {
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
      bookingsContainer.innerHTML += bookingCard;
    });
  } else {
    console.error('Failed to load booking history');
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserData();
  await loadBookingHistory();
});
