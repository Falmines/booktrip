const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const carForm = document.getElementById("carForm");
  const carResults = document.getElementById("carResults");
  const sortCar = document.getElementById("sortCar");
  const filterBtns = document.querySelectorAll(".filter-btn");

  let currentCars = [];

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      navbar.classList.toggle("show");
    });
  }

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(Number(number || 0));
  }

  function renderCars(data) {
    carResults.innerHTML = "";

    if (!data || data.length === 0) {
      carResults.innerHTML = `<p class="empty">Mobil tidak ditemukan.</p>`;
      return;
    }

    data.forEach((car) => {
      carResults.innerHTML += `
        <div class="car-card">
          <img src="${car.image}" alt="${car.car_name}">

          <div class="car-content">
            <span class="car-type">${car.status || "available"}</span>
            <h3>${car.car_name}</h3>
            <p class="car-location">📍 ${car.city}</p>

            <div class="car-specs">
              <span>👥 ${car.seat_count} Kursi</span>
              <span>⚙ ${car.transmission}</span>
              <span>❄ AC</span>
            </div>

            <div class="car-bottom">
              <div class="price">
                <small>Mulai dari</small>
                <b>${formatRupiah(car.price_per_day)}</b>
                <small>/ hari</small>
              </div>

              <button class="book-btn" onclick="goCheckout(${car.id})">
                Pesan
              </button>
            </div>
          </div>
        </div>
      `;
    });
  }

  async function loadCars() {
    try {
      carResults.innerHTML = "<p>Memuat data mobil dari database...</p>";

      const res = await fetch(`${API_URL}/cars`);
      const data = await res.json();

      currentCars = data;
      renderCars(currentCars);
    } catch (error) {
      console.error(error);
      carResults.innerHTML = "<p>Gagal mengambil data mobil dari database.</p>";
    }
  }

  carForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const city = document.getElementById("city").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!startDate || !endDate) {
      alert("Tanggal mulai dan selesai wajib diisi!");
      return;
    }

    if (endDate < startDate) {
      alert("Tanggal selesai tidak boleh sebelum tanggal mulai!");
      return;
    }

    try {
      carResults.innerHTML = "<p>Mencari mobil...</p>";

      const res = await fetch(`${API_URL}/cars/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ city })
      });

      const data = await res.json();

      currentCars = data;
      renderCars(currentCars);
    } catch (error) {
      console.error(error);
      alert("API mobil error / backend belum jalan.");
    }
  });

  sortCar.addEventListener("change", () => {
    let sorted = [...currentCars];

    if (sortCar.value === "cheap") {
      sorted.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
    }

    if (sortCar.value === "expensive") {
      sorted.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
    }

    if (sortCar.value === "seat") {
      sorted.sort((a, b) => Number(b.seat_count) - Number(a.seat_count));
    }

    renderCars(sorted);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const selectedType = btn.dataset.type;

      if (selectedType === "all") {
        renderCars(currentCars);
        return;
      }

      const filtered = currentCars.filter(car =>
        car.transmission === selectedType ||
        car.status === selectedType
      );

      renderCars(filtered);
    });
  });

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  document.getElementById("startDate").value = today.toISOString().split("T")[0];
  document.getElementById("endDate").value = tomorrow.toISOString().split("T")[0];

  loadCars();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=cars&id=${id}`;
}