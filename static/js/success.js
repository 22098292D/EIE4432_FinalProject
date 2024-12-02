const prizes = ['Thank you!', '$10 Discount', '$20 Discount', '$50 Discount', '$0 ! Free Discount!'];
const colors = ['#FFDDC1', '#FFABAB', '#FFC3A0', '#D5AAFF', '#85E3FF'];
let isSpinning = false; // 用于防止重复点击

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const numPrizes = prizes.length;
  const arcSize = (2 * Math.PI) / numPrizes;

  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制扇区
  for (let i = 0; i < numPrizes; i++) {
    ctx.beginPath();
    ctx.moveTo(250, 250); // 圆心 (调整为500px中心)
    ctx.arc(250, 250, 250, i * arcSize, (i + 1) * arcSize);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.stroke();

    // 添加奖品文字
    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate((i + 0.5) * arcSize); // 旋转到文字位置
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(prizes[i], 150, 10); // 将文字显示在扇区中间
    ctx.restore();
  }
}

function startLottery() {
  if (isSpinning) return; // 防止重复点击
  isSpinning = true;

  const lotteryButton = document.getElementById('lotteryButton');
  const prizeMessage = document.getElementById('prizeMessage');
  lotteryButton.style.display = 'none'; // 隐藏按钮
  prizeMessage.style.display = 'block';
  prizeMessage.innerHTML = '<strong>Spinning...</strong>';

  const canvas = document.getElementById('wheelCanvas');
  let currentAngle = 0;
  const numPrizes = prizes.length;
  const arcSize = (2 * Math.PI) / numPrizes;

  // 随机奖品
  const prizeIndex = Math.floor(Math.random() * numPrizes);
  const stopAngle = 2 * Math.PI - prizeIndex * arcSize + arcSize / 2; // 奖品停下的位置

  // 转盘旋转动画
  const spinTime = 5000; // 旋转时间
  const startTime = Date.now();

  function spin() {
    const elapsed = Date.now() - startTime;
    const easing = 1 - Math.pow(1 - elapsed / spinTime, 3); // 缓动公式
    const angle = easing * (8 * Math.PI) + stopAngle; // 旋转的总角度
    currentAngle = angle % (2 * Math.PI);

    // 更新画布旋转角度
    canvas.style.transform = `rotate(${currentAngle}rad)`;

    if (elapsed < spinTime) {
      requestAnimationFrame(spin); // 继续动画
    } else {
      // 显示中奖信息
      prizeMessage.innerHTML = `<h5 class="text-success">Congratulations!</h5><p>You won: <strong>${prizes[prizeIndex]}</strong></p>`;
      isSpinning = false; // 重置状态

      // Update discount if a discount prize is won
      if (prizes[prizeIndex].includes('Discount')) {
        const discountType = prizes[prizeIndex].match(/\d+|free/i)[0];
        updateDiscountForUser(discountType);
      }
    }
  }

  requestAnimationFrame(spin);
}

// 绘制转盘
drawWheel();
async function fetchLatestTicket() {
  try {
    const response = await fetch('/api/tickets/latest');
    if (!response.ok) {
      throw new Error('Failed to fetch ticket');
    }
    const ticket = await response.json();
    displayTicket(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    displayError();
  }
}

function displayTicket(ticket) {
  const ticketContainer = document.querySelector('.card-body');
  if (!ticketContainer) return;

  const template = `
        <div class="row align-items-center">
            <div class="col-md-2">
                <div class="text-muted mb-1">UserId:</div>
                <strong>${ticket.userId}</strong>
            </div>
            
            <div class="col-md-3">
                <h5 class="card-title mb-0">${ticket.movieTitle}</h5>
                <span class="badge bg-primary">${ticket.ticketClass}</span>
            </div>
            
            <div class="col-md-2">
                <div class="text-muted mb-1">${ticket.date}</div>
                <div class="text-muted">${ticket.time}</div>
            </div>
            
            <div class="col-md-3">
                <div class="text-muted mb-1">Venue: ${ticket.venue}</div>
                <div class="text-muted">Seat: ${ticket.seat}</div>
            </div>
            
            <div class="col-md-2 text-end">
                <h5 class="text-primary mb-0">$${ticket.price.toFixed(2)}</h5>
            </div>
        </div>
    `;

  ticketContainer.innerHTML = template;
}

function displayError() {
  const ticketContainer = document.querySelector('.card-body');
  if (!ticketContainer) return;

  ticketContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            Unable to load ticket information. Please try again later.
        </div>
    `;
}

async function updateDiscountForUser(discountType) {
  const state = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userID = state.id;
  if (!userID) {
    console.error('User ID not found in localStorage.');
    return;
  }

  console.log(userID, discountType); //

  try {
    const response = await fetch('/api/users/discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userID: userID, discountType: discountType }),
    });

    if (response.ok) {
      console.log('Discount updated successfully.');
    } else {
      const error = await response.json();
      console.error('Failed to update discount:', error);
    }
  } catch (error) {
    console.error('Error updating discount:', error);
  }
}

// Load ticket information when the page loads
document.addEventListener('DOMContentLoaded', fetchLatestTicket);
