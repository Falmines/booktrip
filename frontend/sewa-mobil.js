const menuBtn = document.getElementById("menuBtn");
const navbar = document.getElementById("navbar");
const carForm = document.getElementById("carForm");
const carResults = document.getElementById("carResults");
const sortCar = document.getElementById("sortCar");
const filterBtns = document.querySelectorAll(".filter-btn");

menuBtn.addEventListener("click", () => {
  navbar.classList.toggle("show");
});

const cars = [
  {
    name: "Toyota Avanza",
    type: "MPV",
    location: "Jakarta",
    seats: 7,
    transmission: "Manual",
    fuel: "Bensin",
    price: 350000,
    img: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Toyota Innova Reborn",
    type: "MPV",
    location: "Jakarta",
    seats: 7,
    transmission: "Automatic",
    fuel: "Diesel",
    price: 650000,
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Honda Brio",
    type: "City Car",
    location: "Bandung",
    seats: 5,
    transmission: "Automatic",
    fuel: "Bensin",
    price: 300000,
    img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Toyota Fortuner",
    type: "SUV",
    location: "Bali",
    seats: 7,
    transmission: "Automatic",
    fuel: "Diesel",
    price: 1200000,
    img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Mitsubishi Pajero",
    type: "SUV",
    location: "Surabaya",
    seats: 7,
    transmission: "Automatic",
    fuel: "Diesel",
    price: 1150000,
    img: "https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Mercedes-Benz C Class",
    type: "Luxury",
    location: "Jakarta",
    seats: 5,
    transmission: "Automatic",
    fuel: "Bensin",
    price: 2500000,
    img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80"
  }
];

let currentCars = [...cars];

function formatRupiah(number){
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

function renderCars(data){
  carResults.innerHTML = "";

  if(data.length === 0){
    carResults.innerHTML = `<p class="empty">Mobil tidak ditemukan.</p>`;
    return;
  }

  data.forEach(car => {
    carResults.innerHTML += `
      <div class="car-card">
        <img src="${car.img}" alt="${car.name}">

        <div class="car-content">
          <span class="car-type">${car.type}</span>
          <h3>${car.name}</h3>
          <p class="car-location">📍 ${car.location}</p>

          <div class="car-specs">
            <span>👥 ${car.seats} Kursi</span>
            <span>⚙ ${car.transmission}</span>
            <span>⛽ ${car.fuel}</span>
            <span>❄ AC</span>
          </div>

          <div class="car-bottom">
            <div class="price">
              <small>Mulai dari</small>
              <b>${formatRupiah(car.price)}</b>
              <small>/ hari</small>
            </div>

            <button class="book-btn" onclick="bookCar('${car.name}')">
              Pesan
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

function bookCar(name){
  alert(`Mobil ${name} berhasil dipilih!`);
}

carForm.addEventListener("submit", function(e){
  e.preventDefault();

  const city = document.getElementById("city").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if(!startDate || !endDate){
    alert("Tanggal mulai dan selesai wajib diisi!");
    return;
  }

  if(endDate < startDate){
    alert("Tanggal selesai tidak boleh sebelum tanggal mulai!");
    return;
  }

  alert(`Mencari mobil di ${city}`);
  renderCars(currentCars);
});

sortCar.addEventListener("change", () => {
  let sorted = [...currentCars];

  if(sortCar.value === "cheap"){
    sorted.sort((a,b) => a.price - b.price);
  }

  if(sortCar.value === "expensive"){
    sorted.sort((a,b) => b.price - a.price);
  }

  if(sortCar.value === "seat"){
    sorted.sort((a,b) => b.seats - a.seats);
  }

  renderCars(sorted);
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(item => item.classList.remove("active"));
    btn.classList.add("active");

    const selectedType = btn.dataset.type;

    if(selectedType === "all"){
      currentCars = [...cars];
    }else{
      currentCars = cars.filter(car => car.type === selectedType);
    }

    renderCars(currentCars);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  document.getElementById("startDate").value = today.toISOString().split("T")[0];
  document.getElementById("endDate").value = tomorrow.toISOString().split("T")[0];

  renderCars(cars);
});