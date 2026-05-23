const API_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const swapBtn = document.getElementById("swapBtn");
  const flightForm = document.getElementById("flightForm");
  const flightResults = document.getElementById("flightResults");
  const sortFlight = document.getElementById("sortFlight");

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      navbar.classList.toggle("show");
    });
  }

  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const fromCity = document.getElementById("fromCity");
      const toCity = document.getElementById("toCity");

      const temp = fromCity.value;
      fromCity.value = toCity.value;
      toCity.value = temp;
    });
  }

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  function renderFlights(data) {
    flightResults.innerHTML = "";

    if (!data || data.length === 0) {
      flightResults.innerHTML = `
        <div class="empty-result">
          <h3>Data tiket tidak ditemukan</h3>
          <p>Coba ganti kota asal, tujuan, atau tanggal keberangkatan.</p>
        </div>
      `;
      return;
    }

    data.forEach((flight) => {
      flightResults.innerHTML += `
        <div class="flight-card">
          <div class="airline">
            <div class="airline-icon">✈</div>
            <div>
              <h3>${flight.airline}</h3>
              <span>Direct Flight</span>
            </div>
          </div>

          <div class="route">
            <div>
              <h3>${flight.departure_time || "-"}</h3>
              <span>${flight.origin}</span>
            </div>

            <div class="line"></div>

            <div>
              <h3>${flight.arrival_time || "-"}</h3>
              <span>${flight.destination}</span>
            </div>

            <div>
              <b>${flight.duration || "Langsung"}</b>
              <span>${flight.class_type || "Ekonomi"}</span>
            </div>
          </div>

          <div class="price">
            <b>${formatRupiah(flight.price)}</b>

            <button onclick="goCheckout(${flight.id})">
              Pilih
            </button>
          </div>
        </div>
      `;
    });
  }

  async function loadAllFlights() {
    try {
      flightResults.innerHTML = "<p>Memuat data tiket...</p>";

      const res = await fetch(`${API_URL}/flights`);
      const data = await res.json();

      renderFlights(data);
    } catch (error) {
      console.error(error);
      flightResults.innerHTML = "<p>Gagal mengambil data tiket dari database.</p>";
    }
  }

  if (flightForm) {
    flightForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fromCity = document.getElementById("fromCity").value.trim();
      const toCity = document.getElementById("toCity").value.trim();
      const departDate = document.getElementById("departDate").value;

      if (!fromCity || !toCity) {
        alert("Kota asal dan tujuan wajib diisi!");
        return;
      }

      if (!departDate) {
        alert("Tanggal berangkat wajib dipilih!");
        return;
      }

      try {
        flightResults.innerHTML = "<p>Mencari tiket...</p>";

        const res = await fetch(`${API_URL}/flights/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            origin: fromCity,
            destination: toCity,
            departure_date: departDate
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Gagal mencari tiket");
          return;
        }

        renderFlights(data);
      } catch (error) {
        console.error(error);
        alert("Backend belum jalan atau API error");
      }
    });
  }

  if (sortFlight) {
    sortFlight.addEventListener("change", async () => {
      try {
        const res = await fetch(`${API_URL}/flights`);
        let data = await res.json();

        if (sortFlight.value === "cheap") {
          data.sort((a, b) => Number(a.price) - Number(b.price));
        }

        if (sortFlight.value === "early") {
          data.sort((a, b) =>
            String(a.departure_time).localeCompare(String(b.departure_time))
          );
        }

        renderFlights(data);
      } catch (error) {
        console.error(error);
      }
    });
  }

  const departDateInput = document.getElementById("departDate");

  if (departDateInput) {
    const today = new Date().toISOString().split("T")[0];
    departDateInput.value = today;
  }

  loadAllFlights();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    window.location.href = "index.html";
    return;
  }

  window.location.href = `checkout.html?type=flights&id=${id}`;
}
const loginBtn = document.getElementById("loginBtn");
const loginModal = document.getElementById("loginModal");
const closeLogin = document.getElementById("closeLogin");

loginBtn.addEventListener("click", () => {
  loginModal.classList.add("active");
});

closeLogin.addEventListener("click", () => {
  loginModal.classList.remove("active");
});