const API_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");
const orderList = document.getElementById("orderList");

if (!token) {
  alert("Silakan login dulu");
  window.location.href = "index.html";
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(Number(number || 0));
}

async function loadOrders() {
  try {
    const res = await fetch(`${API_URL}/my-bookings`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      orderList.innerHTML = `<p>${data.message || "Gagal mengambil pesanan"}</p>`;
      return;
    }

    if (data.length === 0) {
      orderList.innerHTML = "<p>Belum ada pesanan.</p>";
      return;
    }

    orderList.innerHTML = "";

    data.forEach((item) => {
      orderList.innerHTML += `
        <div class="checkout-card" style="margin-top:16px;">
          <h3>${item.service_type}</h3>
          <p>ID Layanan: ${item.service_id}</p>
          <p>Status: <b>${item.status}</b></p>
          <p>Pembayaran: <b>${item.payment_status}</b></p>
          <h3>${formatRupiah(item.total_price)}</h3>
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    orderList.innerHTML = "<p>Gagal load pesanan.</p>";
  }
}

loadOrders();