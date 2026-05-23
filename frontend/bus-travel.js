const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const swapBtn = document.getElementById("swapBtn");
  const busForm = document.getElementById("busForm");
  const busResults = document.getElementById("busResults");
  const sortBus = document.getElementById("sortBus");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let currentBuses = [];

  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    userInfo.textContent = user.name;
    loginBtn.textContent = "Akun Saya";
  }

  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("show");
  });

  swapBtn.addEventListener("click", () => {
    const fromCity = document.getElementById("fromCity");
    const toCity = document.getElementById("toCity");

    const temp = fromCity.value;
    fromCity.value = toCity.value;
    toCity.value = temp;
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

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}j ${m}m`;
  }

  function renderBuses(data) {
    busResults.innerHTML = "";

    if (!data || data.length === 0) {
      busResults.innerHTML = `<p class="empty">Bus atau travel tidak ditemukan.</p>`;
      return;
    }

    data.forEach((bus) => {
      busResults.innerHTML += `
        <div class="bus-card">
          <div class="bus-info">
            <div class="bus-icon">🚌</div>
            <div>
              <h3>${bus.bus_name}</h3>
              <span>${bus.seat_type}</span>
            </div>
          </div>

          <div class="route">
            <div>
              <h3>${bus.departure_time}</h3>
              <span>${bus.origin_city}</span>
            </div>

            <div class="line"></div>

            <div>
              <h3>${bus.arrival_time || "-"}</h3>
              <span>${bus.destination_city}</span>
            </div>

            <div>
              <b>${formatDuration(bus.duration)}</b>
              <span>Langsung</span>
            </div>
          </div>

          <div class="price">
            <b>${formatRupiah(bus.price)}</b>

            <button onclick="goCheckout(${bus.id})">
              Pilih
            </button>
          </div>
        </div>
      `;
    });
  }

  async function loadBuses() {
    try {
      busResults.innerHTML = "<p>Memuat data bus & travel dari database...</p>";

      const res = await fetch(`${API_URL}/buses`);
      const data = await res.json();

      currentBuses = data;
      renderBuses(currentBuses);
    } catch (error) {
      console.error(error);
      busResults.innerHTML = "<p>Gagal mengambil data bus dari database.</p>";
    }
  }

  busForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const origin_city = document.getElementById("fromCity").value.trim();
    const destination_city = document.getElementById("toCity").value.trim();
    const departure_date = document.getElementById("departDate").value;

    if (!origin_city || !destination_city || !departure_date) {
      alert("Kota asal, tujuan, dan tanggal wajib diisi.");
      return;
    }

    try {
      busResults.innerHTML = "<p>Mencari bus & travel...</p>";

      const res = await fetch(`${API_URL}/buses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          origin_city,
          destination_city,
          departure_date
        })
      });

      const data = await res.json();

      currentBuses = data;
      renderBuses(currentBuses);
    } catch (error) {
      console.error(error);
      alert("Backend belum jalan atau API error.");
    }
  });

  sortBus.addEventListener("change", () => {
    let sorted = [...currentBuses];

    if (sortBus.value === "cheap") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortBus.value === "early") {
      sorted.sort((a, b) =>
        String(a.departure_time).localeCompare(String(b.departure_time))
      );
    }

    if (sortBus.value === "fast") {
      sorted.sort((a, b) => Number(a.duration) - Number(b.duration));
    }

    renderBuses(sorted);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const selectedType = btn.dataset.type;

      if (selectedType === "all") {
        renderBuses(currentBuses);
        return;
      }

      const filtered = currentBuses.filter(bus => bus.seat_type === selectedType);
      renderBuses(filtered);
    });
  });

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("departDate").value = today;

  loadBuses();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=buses&id=${id}`;
}