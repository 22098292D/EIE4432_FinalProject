async function register() {
  const userID = document.getElementById('userID').value;
  const password = document.getElementById('password').value;
  const nickname = document.getElementById('nickname').value;
  const email = document.getElementById('email').value;
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const birthdate = document.getElementById('birthdate').value;

  const avatar = document.querySelector('.avatar.border-success')?.src || '';

  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      avatar,
      userID,
      password,
      nickname,
      email,
      gender,
      birthdate,
      discount: {
        10: 0,
        20: 0,
        50: 0,
        free: 0,
      },
    }),
  });

  const result = await response.json();
  if (result.status === 'success') {
    alert('Registration successful!');
    window.location.href = '/login.html';
  } else {
    alert(result.message);
  }
}
