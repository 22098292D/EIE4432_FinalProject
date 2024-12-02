// function selectSeat(seat, type, mapID, seatID) {
//   if (type === 'unavailable' || type === 'available') {
//     // 切换状态
//     const newType = type === 'unavailable' ? 'available' : 'unavailable';
//     const newExistValue = newType === 'available';

//     // 更新座位外观
//     seat.setAttribute('fill', newType === 'available' ? '#32CD32' : '#FFFFFF');

//     // 向后端发送更新请求
//     fetch('/updateSeat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ mapID, seatID, exist: newExistValue }),
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         if (data.status === 'success') {
//           alert('Seat status updated successfully!');
//         } else {
//           alert('Failed to update seat status. Please try again.');
//         }
//       })
//       .catch((error) => {
//         console.error('Error updating seat:', error);
//         alert('An error occurred while updating seat status.');
//       });
//   } else if (type === 'selected') {
//     // 显示当前座位被谁购买
//     alert(`This seat is purchased by user: ${seat.userID}`);
//   }
// }

// function updateLuxury(mapID, isLuxury) {
//   // 根据 isLuxury 判断需要获取哪个输入框的值
//   const inputID = isLuxury ? 'luxuryTrueSeat' : 'luxuryFalseSeat';
//   const seatID = document.getElementById(inputID).value.trim();

//   // 验证输入是否有效
//   if (!seatID) {
//     alert('Please enter a valid Seat ID.');
//     return;
//   }

//   // 调用后端 API 更新数据库
//   fetch('/updateLuxury', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ mapID, seatID, luxury: isLuxury }),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.status === 'success') {
//         alert('Luxury attribute updated successfully!');
//         window.location.reload(); // 刷新页面
//       } else {
//         alert(`Failed to update luxury attribute: ${data.message}`);
//       }
//     })
//     .catch((error) => {
//       console.error('Error updating luxury attribute:', error);
//       alert('An error occurred while updating luxury attribute.');
//     });
// }
