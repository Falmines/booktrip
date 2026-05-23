const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const hotelForm = document.getElementById("hotelForm");
  const hotelResults = document.getElementById("hotelResults");
  const sortHotel = document.getElementById("sortHotel");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let currentHotels = [];

  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    userInfo.textContent = user.name;
    loginBtn.textContent = "Akun Saya";
  }

  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("show");
  });

  loginBtn.addEventListener("click", () => {
    loginModal.classList.add("active");
  });

  closeLogin.addEventListener("click", () => {
    loginModal.classList.remove("active");
  });

  submitLogin.addEventListener("click", async () => {
    const email = document.getElementById("emailLogin").value.trim();
    const password = document.getElementById("passwordLogin").value.trim();

    if (!email || !password) {
      alert("Email dan password wajib diisi");
      return;
    }

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login gagal");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login berhasil");
    location.reload();
  });

  registerBtn.addEventListener("click", async () => {
    const name = prompt("Masukkan nama:");
    const email = prompt("Masukkan email:");
    const password = prompt("Masukkan password:");

    if (!name || !email || !password) {
      alert("Semua data wajib diisi");
      return;
    }

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Register gagal");
      return;
    }

    alert("Register berhasil, silakan login.");
  });

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  function renderHotels(data) {
    hotelResults.innerHTML = "";

    if (!data || data.length === 0) {
      hotelResults.innerHTML = `<p class="empty">Hotel tidak ditemukan.</p>`;
      return;
    }

    data.forEach((hotel) => {
      const facilities = hotel.facilities
        ? hotel.facilities.split(",").map(item => `<span>${item.trim()}</span>`).join("")
        : "";

      hotelResults.innerHTML += `
        <div class="hotel-card">
          <img src="${hotel.image}" alt="${hotel.name}">

          <div class="hotel-content">
            <div class="hotel-top">
              <h3>${hotel.name}</h3>
              <span class="rating">⭐ ${hotel.rating}</span>
            </div>

            <p class="location">📍 ${hotel.city}</p>
            <p>${hotel.address || ""}</p>

            <div class="facilities">
              ${facilities}
            </div>

            <div class="hotel-bottom">
              <div class="price">
                <small>Mulai dari</small>
                <b>${formatRupiah(hotel.price_per_night)}</b>
                <small>/ malam</small>
              </div>

              <button class="book-btn" onclick="goCheckout(${hotel.id})">
                Pesan
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  async function loadHotels() {
    try {
      hotelResults.innerHTML = "<p>Memuat hotel dari database...</p>";

      const res = await fetch(`${API_URL}/hotels`);
      const data = await res.json();

      currentHotels = data;
      renderHotels(currentHotels);
    } catch (error) {
      console.error(error);
      hotelResults.innerHTML = "<p>Gagal mengambil data hotel dari database.</p>";
    }
  }

  hotelForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const city = document.getElementById("city").value.trim();
    const checkin = document.getElementById("checkin").value;
    const checkout = document.getElementById("checkout").value;

    if (!checkin || !checkout) {
      alert("Tanggal check-in dan check-out wajib diisi!");
      return;
    }

    if (checkout <= checkin) {
      alert("Tanggal check-out harus setelah check-in!");
      return;
    }

    try {
      hotelResults.innerHTML = "<p>Mencari hotel...</p>";

      const res = await fetch(`${API_URL}/hotels/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ city })
      });

      const data = await res.json();

      currentHotels = data;
      renderHotels(currentHotels);
    } catch (error) {
      console.error(error);
      alert("Backend belum jalan atau API error.");
    }
  });

  sortHotel.addEventListener("change", () => {
    let sorted = [...currentHotels];

    if (sortHotel.value === "cheap") {
      sorted.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
    }

    if (sortHotel.value === "expensive") {
      sorted.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));
    }

    if (sortHotel.value === "rating") {
      sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    renderHotels(sorted);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const star = btn.dataset.star;

      if (star === "all") {
        renderHotels(currentHotels);
        return;
      }

      const filtered = currentHotels.filter(hotel => Number(hotel.star) === Number(star));
      renderHotels(filtered);
    });
  });

  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  document.getElementById("checkin").value = today.toISOString().split("T")[0];
  document.getElementById("checkout").value = tomorrow.toISOString().split("T")[0];

  loadHotels();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=hotels&id=${id}`;
}