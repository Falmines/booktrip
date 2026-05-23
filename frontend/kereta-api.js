const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const swapBtn = document.getElementById("swapBtn");
  const trainForm = document.getElementById("trainForm");
  const trainResults = document.getElementById("trainResults");
  const sortTrain = document.getElementById("sortTrain");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let currentTrains = [];

  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    userInfo.textContent = user.name;
    loginBtn.textContent = "Akun Saya";
  }

  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("show");
  });

  swapBtn.addEventListener("click", () => {
    const fromStation = document.getElementById("fromStation");
    const toStation = document.getElementById("toStation");

    const temp = fromStation.value;
    fromStation.value = toStation.value;
    toStation.value = temp;
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

  function renderTrains(data) {
    trainResults.innerHTML = "";

    if (!data || data.length === 0) {
      trainResults.innerHTML = `<p class="empty">Kereta tidak ditemukan.</p>`;
      return;
    }

    data.forEach((train) => {
      trainResults.innerHTML += `
        <div class="train-card">
          <div class="train-info">
            <div class="train-icon">🚆</div>
            <div>
              <h3>${train.train_name}</h3>
              <span>${train.class_type}</span>
            </div>
          </div>

          <div class="route">
            <div>
              <h3>${train.departure_time}</h3>
              <span>${train.origin_station}</span>
            </div>

            <div class="line"></div>

            <div>
              <h3>${train.arrival_time}</h3>
              <span>${train.destination_station}</span>
            </div>

            <div>
              <b>${formatDuration(train.duration)}</b>
              <span>Langsung</span>
            </div>
          </div>

          <div class="price">
            <b>${formatRupiah(train.price)}</b>

            <button onclick="goCheckout(${train.id})">
              Pilih
            </button>
          </div>
        </div>
      `;
    });
  }

  async function loadTrains() {
    try {
      trainResults.innerHTML = "<p>Memuat data kereta dari database...</p>";

      const res = await fetch(`${API_URL}/trains`);
      const data = await res.json();

      currentTrains = data;
      renderTrains(currentTrains);
    } catch (error) {
      console.error(error);
      trainResults.innerHTML = "<p>Gagal mengambil data kereta dari database.</p>";
    }
  }

  trainForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const origin_station = document.getElementById("fromStation").value.trim();
    const destination_station = document.getElementById("toStation").value.trim();
    const departure_date = document.getElementById("departDate").value;

    if (!origin_station || !destination_station || !departure_date) {
      alert("Stasiun asal, tujuan, dan tanggal wajib diisi.");
      return;
    }

    try {
      trainResults.innerHTML = "<p>Mencari kereta...</p>";

      const res = await fetch(`${API_URL}/trains/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          origin_station,
          destination_station,
          departure_date
        })
      });

      const data = await res.json();

      currentTrains = data;
      renderTrains(currentTrains);
    } catch (error) {
      console.error(error);
      alert("Backend belum jalan atau API error.");
    }
  });

  sortTrain.addEventListener("change", () => {
    let sorted = [...currentTrains];

    if (sortTrain.value === "cheap") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortTrain.value === "early") {
      sorted.sort((a, b) =>
        String(a.departure_time).localeCompare(String(b.departure_time))
      );
    }

    if (sortTrain.value === "fast") {
      sorted.sort((a, b) => Number(a.duration) - Number(b.duration));
    }

    renderTrains(sorted);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const selectedClass = btn.dataset.class;

      if (selectedClass === "all") {
        renderTrains(currentTrains);
        return;
      }

      const filtered = currentTrains.filter(train => train.class_type === selectedClass);
      renderTrains(filtered);
    });
  });

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("departDate").value = today;

  loadTrains();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=trains&id=${id}`;
}