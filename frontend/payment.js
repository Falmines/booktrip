const API_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);
const bookingId = params.get("booking_id");

let bookingData = null;

async function loadBooking() {
  const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  bookingData = data;

  document.getElementById("bookingId").textContent = data.id;
  document.getElementById("bookingStatus").textContent = data.status;
  document.getElementById("paymentTotal").textContent =
    `Rp ${Number(data.total_price).toLocaleString("id-ID")}`;
}

document.getElementById("payBtn").addEventListener("click", async () => {
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (!paymentMethod) {
    alert("Pilih metode pembayaran");
    return;
  }

  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      booking_id: bookingId,
      payment_method: paymentMethod,
      amount: bookingData.total_price
    })
  });

  const data = await res.json();

  alert(data.message);
  window.location.href = "pesanan.html";
});

loadBooking();