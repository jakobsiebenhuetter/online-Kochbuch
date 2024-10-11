// Zutatenliste Funktionalität hinzufügen !!!
// Such Funktion verbessern
const nameInput = document.getElementById("titel-bearbeiten");
const beschreibungInput = document.getElementById("beschreibung-bearbeiten");

async function rezeptSuche(e) {
  e.preventDefault();

  const listItems = document.getElementById("items-database");
  const input = { name: rezeptSucheInput.value };
  const response = await fetchData("/rezept-suche", input);

  const rezepte = await response.json();

  listItems.innerHTML = "";


  for (const rezept of rezepte) {
    const searchItem = document.createElement("li");
    searchItem.dataset.rezeptId = rezept.id_Rezept;

    searchItem.textContent = rezept.Name;

    searchItem.onclick = async (e) => {
      e.preventDefault();
      zutatenList.innerHTML = "";
      listItems.innerHTML = "";

      rezeptSucheInput.dataset.id = searchItem.dataset.rezeptId;
      rezeptSucheInput.value = searchItem.textContent;

      const input = {
        rezept_id: rezeptSucheInput.dataset.id,
      };

      getRezept(input, nameInput, beschreibungInput);
    };

    listItems.appendChild(searchItem);
  }
}

async function deleteRezept() {
  const id = { id: deleteRezeptButton.dataset.id };
  fetchData("/rezept-loeschen", id);
}

async function getRezept(input, nameInput, beschreibungInput) {
  const response = await fetchData("/rezept-ausgewaehlt", input);

  const rezeptFromDB = await response.json();

  nameInput.value = rezeptFromDB[0].Name;
  beschreibungInput.value = rezeptFromDB[0].Beschreibung;
  rezeptBearbeitenButton.dataset.id = `${rezeptFromDB[0].id_Rezept}`;
  deleteRezeptButton.dataset.id = `${rezeptFromDB[0].id_Rezept}`;

  if (rezeptFromDB.length !== 0) {
    const zutatenLabel = document.createElement("h3");

    zutatenLabel.textContent = "Folgende Zutaten wurden gefunden:";
    zutatenList.appendChild(zutatenLabel);

    populateZutaten(rezeptFromDB);
  }
}

async function updateRezept() {
 console.log("Update Rezept aufgerufen");

  const allElements = document.querySelectorAll("#zutaten-bearbeiten-löschen div p, #zutaten-bearbeiten-löschen div input");
  const updatedZutaten = [];
  
  allElements.forEach((element) => {
    if (element.tagName === "P") {
      updatedZutaten.push({
        zutaten_id: element.dataset.id,
        zutat: element.textContent,
      });
    } else if (element.tagName === "INPUT") {
      updatedZutaten.push({
        zutaten_id: element.dataset.id,
        zutat: element.value,
      });
    }
  });
 
 
  
  const actualData = {
    id: rezeptBearbeitenButton.dataset.id,
    name: nameInput.value,
    beschreibung: beschreibungInput.value,
    zutaten: updatedZutaten,
  };

   updateData("/rezept-bearbeiten", actualData);

}

function populateZutaten(rezeptFromDB) {
  for (const zutat of rezeptFromDB) {
    if (zutat.Zutaten !== null) {
      const zutatenItem = document.createElement("p");
      zutatenItem.dataset.id = zutat.id_zutaten;
      zutatenItem.textContent = zutat.Zutaten;

      zutatenList.appendChild(zutatenItem);

      zutatenList.addEventListener("click", (event) => {
        if (event.target.dataset.id === `${zutat.id_zutaten}`) {
          if (event.target.tagName === "P") {
            const newInput = document.createElement("input");
            newInput.value = zutatenItem.textContent;
            newInput.dataset.id = zutatenItem.dataset.id;
            zutatenList.replaceChild(newInput, zutatenItem);
          }
        }
      });
    }
  }
}

async function fetchData(uri, input) {
  const response = await fetch(uri, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    cache:"no-store"
  });

  return response;
}

async function updateData(uri, input) {
await fetch(uri, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    cache:"no-store"
  });


}


function openWindow() {
  zweitesFenster.style.opacity = "1";
  zweitesFenster.style.transform = "translateY(920px)";
}

function closeWindow() {
  zweitesFenster.style.transform = "translateY(-700px)";
  zweitesFenster.addEventListener("transitionend", function handler() {
    zweitesFenster.style.opacity = "0";

    zweitesFenster.removeEventListener("transitionend", handler);
  });
}
