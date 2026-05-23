const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const promoResults = document.getElementById("promoResults");
  const promoCount = document.getElementById("promoCount");
  const searchPromo = document.getElementById("searchPromo");
  const sortPromo = document.getElementById("sortPromo");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let allPromos = [];
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Register gagal");
      return;
    }

    alert("Register berhasil, silakan login.");
  });

  function getBannerClass(category) {
    if (category === "Hotel") return "hotel";
    if (category === "Kereta") return "kereta";
    if (category === "Bus") return "bus";
    if (category === "Mobil") return "mobil";
    return "";
  }

  function formatDate(dateString) {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function renderPromos() {
    const keyword = searchPromo.value.toLowerCase();

    let filtered = allPromos.filter((promo) => {
      const matchCategory =
        currentCategory === "all" || promo.category === currentCategory;

      const matchKeyword =
        promo.title.toLowerCase().includes(keyword) ||
        promo.category.toLowerCase().includes(keyword) ||
        promo.code.toLowerCase().includes(keyword) ||
        promo.description.toLowerCase().includes(keyword);

      return matchCategory && matchKeyword;
    });

    if (sortPromo.value === "biggest") {
      filtered.sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent));
    }

    if (sortPromo.value === "latest") {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    promoCount.textContent = `${filtered.length} promo`;
    promoResults.innerHTML = "";

    if (filtered.length === 0) {
      promoResults.innerHTML = `<p class="empty">Promo tidak ditemukan.</p>`;
      return;
    }

    filtered.forEach((promo) => {
      promoResults.innerHTML += `
        <div class="promo-card">
          <div class="promo-banner ${getBannerClass(promo.category)}">
            <small>${promo.category}</small>
            <h3>DISKON ${promo.discount_percent}%</h3>
            <span>BookTrip Promo</span>
          </div>

          <div class="promo-content">
            <h3>${promo.title}</h3>
            <p>${promo.description}</p>

            <div class="coupon-box">
              <small>Kode Promo</small>

              <div class="coupon-code">
                <b>${promo.code}</b>
                <button class="copy-btn" onclick="copyCode('${promo.code}')">
                  Salin
                </button>
              </div>
            </div>

            <div class="promo-footer">
              <span class="expired">
                Berlaku s/d ${formatDate(promo.end_date)}
              </span>

              <button class="claim-btn" onclick="claimPromo(${promo.id})">
                Klaim
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  async function loadPromos() {
    try {
      promoResults.innerHTML = "<p>Memuat promo dari database...</p>";

      const res = await fetch(`${API_URL}/promos`);
      const data = await res.json();

      allPromos = data;
      renderPromos();
    } catch (error) {
      console.error(error);
      promoResults.innerHTML = "<p>Gagal mengambil promo dari database.</p>";
    }
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      currentCategory = btn.dataset.category;
      renderPromos();
    });
  });

  searchPromo.addEventListener("input", renderPromos);
  sortPromo.addEventListener("change", renderPromos);

  loadPromos();
});

function copyCode(code) {
  navigator.clipboard.writeText(code);
  alert(`Kode promo ${code} berhasil disalin!`);
}

async function claimPromo(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu untuk klaim promo.");
    return;
  }

  const res = await fetch(`http://localhost:5000/api/promos/claim/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  alert(data.message);
}