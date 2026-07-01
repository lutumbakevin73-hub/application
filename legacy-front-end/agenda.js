// =============================
// PROGRAMME CHOISI
// =============================

const selectedProgram =
  localStorage.getItem("selectedProgram");


// =============================
// NOMBRE DE SEANCES
// =============================

let numberOfSessions = 2;

switch (selectedProgram) {
  case "prog1":
    numberOfSessions = 2;
    break;
  case "prog2":
    numberOfSessions = 3;
    break;
  case "prog3":
    numberOfSessions = 5;
    break;
  case "prog4":
    numberOfSessions = 7;
    break;
}

// =============================
// CONTAINER
// =============================

const container =
  document.getElementById("sessionsContainer");

// =============================
// GENERATION DES SEANCES
// =============================

for (let i = 1; i <= numberOfSessions; i++) {
  container.innerHTML += `
    <div class="bg-white rounded-xl shadow p-6 mb-4">

      <h2 class="font-bold text-blue-700 text-lg mb-4">
        Séance ${i}
      </h2>

      <label class="font-semibold">Date</label>
      <input
        class="datePicker border rounded-lg p-3 w-full mt-2 mb-4"
        placeholder="Choisir une date"
      >

      <label class="font-semibold">Heure</label>
      <input
        class="timePicker border rounded-lg p-3 w-full mt-2"
        placeholder="Choisir une heure"
      >

    </div>
  `;
}

// =============================
// FLATPICKR (UNE SEULE FOIS)
// =============================

/*flatpickr(".datePicker", {
  dateFormat: "d/m/Y",
  minDate: "today"
});

flatpickr(".timePicker", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i"
});*/
flatpickr(".datePicker", {
  dateFormat: "d/m/Y",
  minDate: "today"
});
// =============================
// RECUPERATION DONNEES
// =============================

function getAgendaData() {
  const dates = document.querySelectorAll(".datePicker");
  const times = document.querySelectorAll(".timePicker");

  const sessions = [];

  for (let i = 0; i < numberOfSessions; i++) {
    sessions.push({
      date: dates[i].value,
      time: times[i].value
    });
  }

  return sessions;
}

// =============================
// SAUVEGARDE
// =============================

document
  .getElementById("saveAgenda")
  .addEventListener("click",async ()  => {

    const phone =
      document.getElementById("phone").value;

    const sessions =
      getAgendaData();

    if (!phone) {
      alert("Ajoute ton numéro de téléphone");
      return;
    }

    const incomplete =
      sessions.some(s => !s.date || !s.time);

    if (incomplete) {
      alert("Complète toutes les séances");
      return;
    }

    const agenda = {
      program: selectedProgram,
      phone,
      sessions
    };

    /*localStorage.setItem(
      "agendaData",
      JSON.stringify(agenda)
    );
*/
await fetch("http://localhost:5000/api/agenda/save", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(agenda)
});
    showSuccessPopup();
  });

// =============================
// POPUP
// =============================

function showSuccessPopup() {
  const div = document.createElement("div");

  div.innerHTML = `
    <div style="
      position:fixed;
      top:0;left:0;
      width:100%;height:100%;
      background:rgba(0,0,0,0.5);
      display:flex;
      justify-content:center;
      align-items:center;
    ">

      <div style="
        background:white;
        padding:30px;
        border-radius:12px;
        text-align:center;
        width:300px;
      ">

        <h2>Merci </h2>
        <p>Nous vous recontacterons pour vos séances d’étude.</p>

        <button onclick="this.parentElement.parentElement.remove()"
          style="
            margin-top:15px;
            padding:10px 20px;
            background:#2563eb;
            color:white;
            border:none;
            border-radius:6px;
          ">
          OK
        </button>

      </div>

    </div>
  `;

  document.body.appendChild(div);
}