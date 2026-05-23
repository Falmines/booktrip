const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const xpResults = document.getElementById("xpResults");
  const xpCount = document.getElementById("xpCount");
  const searchXp = document.getElementById("searchXp");
  const sortXp = document.getElementById("sortXp");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let allExperiences = [];
  let currentCategory = "all";

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

  function renderExperiences() {
    const keyword = searchXp.value.toLowerCase();

    let filtered = allExperiences.filter((item) => {
      const matchCategory =
        currentCategory === "all" || item.category === currentCategory;

      const matchKeyword =
        item.title.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        item.location.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      return matchCategory && matchKeyword;
    });

    if (sortXp.value === "cheap") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortXp.value === "expensive") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sortXp.value === "rating") {
      filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    xpCount.textContent = `${filtered.length} aktivitas`;
    xpResults.innerHTML = "";

    if (filtered.length === 0) {
      xpResults.innerHTML = `<p class="empty">Aktivitas tidak ditemukan.</p>`;
      return;
    }

    filtered.forEach((item) => {
      xpResults.innerHTML += `
        <div class="xp-card">
          <img src="${item.image}" alt="${item.title}">

          <div class="xp-content">
            <span class="xp-category">${item.category}</span>

            <h3>${item.title}</h3>

            <p class="xp-location">📍 ${item.location}</p>
            <p class="xp-desc">${item.description}</p>

            <div class="xp-meta">
              <span>⭐ ${item.rating}</span>
              <span>⏱ ${item.duration}</span>
            </div>

            <div class="xp-bottom">
              <div class="price">
                <small>Mulai dari</small>
                <b>${formatRupiah(item.price)}</b>
              </div>

              <button class="book-btn" onclick="goCheckout(${item.id})">
                Pesan
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  async function loadExperiences() {
    try {
      xpResults.innerHTML = "<p>Memuat aktivitas dari database...</p>";

      const res = await fetch(`${API_URL}/xperiences`);
      const data = await res.json();

      allExperiences = data;
      renderExperiences();
    } catch (error) {
      console.error(error);
      xpResults.innerHTML = "<p>Gagal mengambil data Xperience dari database.</p>";
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      currentCategory = btn.dataset.category;
      renderExperiences();
    });
  });

  searchXp.addEventListener("input", renderExperiences);
  sortXp.addEventListener("change", renderExperiences);

  loadExperiences();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=xperiences&id=${id}`;
}