async function handleLogout() {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result = await response.json();

    if (result.status === 'success') {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('bookingState');
      localStorage.removeItem('seatState');
      window.location.href = '/homePage.html';
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.');
  }
}
