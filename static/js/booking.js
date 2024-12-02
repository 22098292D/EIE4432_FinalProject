let currentPrice = 0;
let originalPrice = 0;
let baseFirstClassPrice = 0;
let baseSecondClassPrice = 0;
let discountData = null;
let bookingState = null;
let seatState = null;
let userInfo = null;
document.addEventListener('DOMContentLoaded', async function () {
  // Get form elements
  const movieSelect = document.getElementById('movieSelect');
  const dateSelect = document.getElementById('dateSelect');
  const venueDisplay = document.getElementById('venueDisplay');
  const priceDisplay = document.getElementById('priceDisplay');
  const discountSelect = document.getElementById('discountSelect');
  const originalPriceDisplay = document.getElementById('originalPrice');
  const timeSelect = document.getElementById('timeSelect');
  // Get movie card elements
  const movieInfoCard = document.getElementById('movieInfoCard');
  const moviePoster = document.getElementById('moviePoster');
  const movieTitleElement = document.getElementById('movieTitle');
  const movieDirector = document.getElementById('movieDirector');
  const movieDateElement = document.getElementById('movieDate');
  const movieTime = document.getElementById('movieTime');
  const movieVenue = document.getElementById('movieVenue');
  const movieDescription = document.getElementById('movieDescription');
  const firstClassPrice = document.getElementById('firstClassPrice');
  const secondClassPrice = document.getElementById('secondClassPrice');

  let eventsData = [];

  // Format date for display
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  async function getCurrentUserId() {
    try {
      // 从 localStorage 或 sessionStorage 获取用户信息
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        console.log('No user logged in');
        return null;
      }

      const user = JSON.parse(userInfo);
      return user.id; // 假设用户信息中包含 id 字段
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async function fetchUserDiscounts() {
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        discountSelect.innerHTML = '<option value="">Please login to use discounts</option>';
        discountSelect.disabled = true;
        return;
      }

      // 启用优惠券选择
      discountSelect.disabled = false;

      const response = await fetch(`/api/users/${userId}`);
      const userData = await response.json();
      discountData = userData.discount;

      // 重置优惠券下拉框
      discountSelect.innerHTML = '<option value="">No discount</option>';

      // 添加可用的优惠券选项
      Object.entries(discountData).forEach(([discount, count]) => {
        if (count > 0) {
          const option = document.createElement('option');
          option.value = discount;
          option.textContent =
            discount === 'free' ? `Free ticket (${count} remaining)` : `${discount}% off (${count} remaining)`;
          discountSelect.appendChild(option);
        }
      });
    } catch (error) {
      console.error('Error fetching discount data:', error);
      discountSelect.innerHTML = '<option value="">Error loading discounts</option>';
    }
  }
  function checkLoginStatus() {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      // 用户未登录，跳转到登录页面
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
  // 更新价格显示的函数
  function updatePrice(isLuxury) {
    const basePrice = isLuxury ? baseFirstClassPrice : baseSecondClassPrice;
    originalPrice = basePrice; // Store original price for database

    currentPrice = basePrice; // Start with base price
    const selectedDiscount = discountSelect.value;

    // Calculate discounted price for display
    if (selectedDiscount === 'free') {
      currentPrice = 0;
    } else if (selectedDiscount) {
      const discountPercent = parseInt(selectedDiscount, 10);
      currentPrice = basePrice * (1 - discountPercent / 100);
    }

    // Update price display
    if (priceDisplay) {
      priceDisplay.textContent = `$${currentPrice.toFixed(2)}`;
    }

    // Show original price if discount applied
    if (originalPriceDisplay) {
      if (selectedDiscount && basePrice > 0) {
        originalPriceDisplay.textContent = `$${basePrice.toFixed(2)}`;
        originalPriceDisplay.classList.remove('d-none');
      } else {
        originalPriceDisplay.classList.add('d-none');
      }
    }

    // Update booking state
    const state = JSON.parse(localStorage.getItem('bookingState') || '{}');
    state.price = originalPrice; // Save original price
    state.luxury = isLuxury; // Save class selection
    localStorage.setItem('bookingState', JSON.stringify(state));
  }
  function saveBookingState() {
    const state = {
      movieId: movieSelect.value,
      dateId: dateSelect.value,
      timeId: timeSelect.value,
      discountId: discountSelect.value,
      price: currentPrice,
      originalPrice: originalPrice,
    };
    localStorage.setItem('bookingState', JSON.stringify(state));
  }

  // 添加恢复状态的函数
  async function restoreBookingState() {
    const savedState = localStorage.getItem('bookingState');
    if (!savedState) return;

    const state = JSON.parse(savedState);

    // 等待事件数据加载
    if (eventsData.length === 0) {
      await fetchEvents();
    }

    // 恢复电影选择
    if (state.movieId) {
      movieSelect.value = state.movieId;
      // 手动触发 change 事件来填充日期选择
      movieSelect.dispatchEvent(new Event('change'));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 恢复日期选择
      if (state.dateId) {
        dateSelect.disabled = false; // 确保启用日期选择
        dateSelect.value = state.dateId;
        // 手动触发 change 事件来填充时间选择
        dateSelect.dispatchEvent(new Event('change'));

        await new Promise((resolve) => setTimeout(resolve, 100));

        // 恢复时间选择
        if (state.timeId) {
          timeSelect.disabled = false; // 确保启用时间选择
          timeSelect.value = state.timeId;

          // 手动触发时间选择的 change 事件来更新其他信息
          timeSelect.dispatchEvent(new Event('change'));

          // 恢复优惠券选择
          if (state.discountId) {
            discountSelect.value = state.discountId;
            // 更新价格显示
            updatePrice(state.originalPrice);
          }
        }
      }
    }
  }

  // 优惠券选择变化事件
  discountSelect.addEventListener('change', function () {
    const state = JSON.parse(localStorage.getItem('bookingState') || '{}');
    const isLuxury = state.luxury || false;
    updatePrice(isLuxury);
    saveBookingState();
  });

  // Update movie info card
  function updateMovieCard(event) {
    if (!movieInfoCard) return;

    movieInfoCard.classList.remove('d-none');

    if (moviePoster) moviePoster.src = event.imageUrl || '/img/default-movie-poster.jpg';
    if (movieTitleElement) movieTitleElement.textContent = event.movieTitle;
    if (movieDirector) movieDirector.textContent = event.director;
    if (movieDateElement) movieDateElement.textContent = formatDate(event.showDate);
    if (movieTime) movieTime.textContent = `${event.startTime} - ${event.endTime}`;
    if (movieVenue) movieVenue.textContent = event.venue;
    if (movieDescription) movieDescription.textContent = event.description;
    if (firstClassPrice) firstClassPrice.textContent = event.firstClassPrice;
    if (secondClassPrice) secondClassPrice.textContent = event.secondClassPrice;
  }

  // Fetch events data from the server
  async function fetchEvents() {
    try {
      const response = await fetch('/api/events');
      eventsData = await response.json();
      console.log('Fetched events:', eventsData);

      // Populate movie select with unique movie titles
      const uniqueMovies = [...new Set(eventsData.map((event) => event.movieTitle))];
      uniqueMovies.forEach((movie) => {
        const option = document.createElement('option');
        option.value = movie;
        option.textContent = movie;
        movieSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  // Handle movie selection
  movieSelect.addEventListener('change', function () {
    // Reset dependent fields
    dateSelect.innerHTML = '<option value="">Choose a date...</option>';
    venueDisplay.value = '';
    if (priceDisplay) priceDisplay.textContent = '$0';
    if (movieInfoCard) movieInfoCard.classList.add('d-none');

    if (this.value) {
      console.log('Selected movie:', this.value);

      // Enable date select
      dateSelect.disabled = false;

      // Get all events for selected movie
      const movieEvents = eventsData.filter((event) => event.movieTitle === this.value);
      console.log('Found movie events:', movieEvents);

      // Get unique dates for the selected movie
      const uniqueDates = [...new Set(movieEvents.map((event) => event.showDate))];
      console.log('Unique dates:', uniqueDates);

      // Populate date select
      uniqueDates.forEach((date) => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        dateSelect.appendChild(option);
      });
    } else {
      dateSelect.disabled = true;
    }
  });

  dateSelect.addEventListener('change', function () {
    // 重置时间选择和场地显示
    timeSelect.innerHTML = '<option value="">Choose a time...</option>';
    timeSelect.disabled = true;
    venueDisplay.value = '';
    if (priceDisplay) priceDisplay.textContent = '$0';
    if (movieInfoCard) movieInfoCard.classList.add('d-none');

    if (this.value) {
      console.log('Selected date:', this.value);

      // 找到所有匹配当前电影和日期的场次
      const matchingEvents = eventsData.filter(
        (event) => event.movieTitle === movieSelect.value && event.showDate === this.value
      );
      console.log('Matching events:', matchingEvents);

      if (matchingEvents.length > 0) {
        // 启用时间选择并填充可用时间
        timeSelect.disabled = false;
        matchingEvents.forEach((event) => {
          const option = document.createElement('option');
          option.value = event.startTime;
          option.textContent = `${event.startTime} - ${event.endTime}`;
          timeSelect.appendChild(option);
        });

        // 如果只有一个场次，自动显示场地和更新信息
        if (matchingEvents.length === 1) {
          const selectedEvent = matchingEvents[0];
          timeSelect.value = matchingEvents[0].startTime;
          venueDisplay.value = selectedEvent.venue;
          if (priceDisplay) priceDisplay.textContent = `$${selectedEvent.firstClassPrice}`;
          updateMovieCard(selectedEvent);
        }
      }
    } else {
      // 重置所有显示
      venueDisplay.value = '';
      if (priceDisplay) priceDisplay.textContent = '$0';
      if (movieInfoCard) movieInfoCard.classList.add('d-none');
    }
  });

  // 添加时间选择的事件处理器
  timeSelect.addEventListener('change', function () {
    if (this.value) {
      console.log('Selected time:', this.value);

      const selectedEvent = eventsData.find(
        (event) =>
          event.movieTitle === movieSelect.value &&
          event.showDate === dateSelect.value &&
          event.startTime === this.value
      );

      console.log('Found event:', selectedEvent);

      if (selectedEvent) {
        // Store prices for later use
        baseFirstClassPrice = selectedEvent.firstClassPrice;
        baseSecondClassPrice = selectedEvent.secondClassPrice;

        // Get luxury status from booking state
        const state = JSON.parse(localStorage.getItem('bookingState') || '{}');
        const isLuxury = state.luxury || false;

        venueDisplay.value = selectedEvent.venue;
        updatePrice(isLuxury);
        updateMovieCard(selectedEvent);
      }
    } else {
      venueDisplay.value = '';
      if (priceDisplay) priceDisplay.textContent = '$0';
      if (movieInfoCard) movieInfoCard.classList.add('d-none');
    }
    saveBookingState();
  });
  async function saveTicket() {
    try {
      bookingState = JSON.parse(localStorage.getItem('bookingState'));
      userInfo = JSON.parse(localStorage.getItem('userInfo'));
      seatState = JSON.parse(localStorage.getItem('seatState'));

      if (!bookingState || !userInfo || !seatState) {
        throw new Error('Missing booking state or user information');
      }

      // 获取完整的事件信息，包括开始和结束时间
      const selectedEvent = eventsData.find(
        (event) =>
          event.movieTitle === bookingState.movieId &&
          event.showDate === bookingState.dateId &&
          event.startTime === bookingState.timeId
      );

      if (!selectedEvent) {
        throw new Error('Could not find event details');
      }

      const now = new Date();
      now.setHours(now.getHours() + 8);
      const bookingTime = now.toISOString();
      const discountType = bookingState.discountId || null;
      const ticketData = {
        mapID: selectedEvent._id,
        userId: userInfo.id,
        movieTitle: bookingState.movieId,
        ticketClass: seatState.luxury ? 'First Class' : 'Second Class',
        date: bookingState.dateId,
        time: `${selectedEvent.startTime} - ${selectedEvent.endTime}`, // 完整的时间信息
        venue: document.getElementById('venueDisplay').value,
        seat: seatState.seatId,
        price: originalPrice,
        bookingTime: bookingTime,
        discount: {
          type: discountType,
          amount: discountType === 'free' ? 100 : parseInt(discountType || '0', 10),
        },
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        throw new Error('Failed to save ticket');
      }

      localStorage.removeItem('bookingState');
      localStorage.removeItem('seatState');

      return true;
    } catch (error) {
      console.error('Error saving ticket:', error);
      return false;
    }
  }
  document.querySelector('a[href="UserMap.html"]').addEventListener('click', function (event) {
    event.preventDefault(); // 防止默认跳转行为
    // 获取用户选择的电影和时间的相关信息

    const selectedEvent = eventsData.find(
      (event) =>
        event.movieTitle === movieSelect.value &&
        event.showDate === dateSelect.value &&
        event.startTime === timeSelect.value
    );

    if (selectedEvent && selectedEvent._id) {
      // 构造跳转的 URL
      const targetUrl = `UserMap/${selectedEvent._id}`; // 保存当前状态

      saveBookingState(); // 跳转到 UserMap 页面

      window.location.href = targetUrl;
    } else {
      alert('Please select a valid movie, date, and time before choosing a seat.');
    }
  });
  function updateSeatInfo() {
    const seatInfoElement = document.getElementById('seatInfo');
    if (!seatInfoElement) {
      console.error('Seat info element not found');
      return;
    }

    try {
      const seatStateStr = localStorage.getItem('seatState');
      console.log('Current seatState:', seatStateStr); // 添加调试日志

      if (!seatStateStr) {
        seatInfoElement.textContent = 'No seat selected';
        return;
      }

      const seatState = JSON.parse(seatStateStr);
      console.log('Parsed seatState:', seatState); // 添加调试日志

      if (seatState && seatState.seatId) {
        const seatClass = seatState.luxury ? 'First Class' : 'Second Class';
        seatInfoElement.textContent = `Selected: ${seatClass} - Seat ${seatState.seatId}`;
        seatInfoElement.style.color = '#0d6efd'; // Bootstrap primary color
        updatePrice(seatState.luxury);
      } else {
        seatInfoElement.textContent = 'No seat selected';
      }
    } catch (error) {
      console.error('Error updating seat info:', error);
      seatInfoElement.textContent = 'No seat selected';
    }
  }

  fetchUserDiscounts();

  // Initial fetch of events
  fetchEvents().then(() => {
    restoreBookingState();
  });
  const confirmPayBtn = document.getElementById('confirmPayBtn');
  const bookingSection = document.getElementById('bookingSection');
  const paymentSection = document.getElementById('paymentSection');

  // Handle payment button click
  confirmPayBtn.addEventListener('click', function () {
    if (!checkLoginStatus()) {
      return;
    }
    if (!movieSelect.value || !dateSelect.value || !timeSelect.value) {
      alert('Please select both movie and date before proceeding to payment.');
      return;
    }
    const seatState = localStorage.getItem('seatState');
    if (!seatState) {
      alert('Please choose your seat before proceeding to payment.');
      return;
    }
    bookingSection.classList.add('d-none');
    paymentSection.classList.remove('d-none');
  });

  // Function to go back to booking
  window.backToBooking = function () {
    paymentSection.classList.add('d-none');
    bookingSection.classList.remove('d-none');
  };

  // Function to validate payment
  window.validatePayment = async function () {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const cardPassword = document.getElementById('cardPassword').value.trim();

    if (!cardNumber || !cardPassword) {
      alert('Payment failed. Please enter both your card number and password.');
      return;
    }

    // Save ticket data
    const ticketSaved = await saveTicket();

    if (ticketSaved) {
      window.location.href = 'success.html';
    } else {
      alert('Failed to process your booking. Please try again.');
    }
  };

  window.addEventListener('storage', function (e) {
    if (e.key === 'seatState') {
      updateSeatInfo();
    }
    if (e.key === 'userInfo') {
      fetchUserDiscounts();
    }
  });
  window.addEventListener('pageshow', function (e) {
    updateSeatInfo();
  });

  window.addEventListener('focus', function () {
    updateSeatInfo();
  });
  updateSeatInfo();
});
