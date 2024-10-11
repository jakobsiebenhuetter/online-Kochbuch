const searchInput = document.getElementById("search-rezept-input");
const rezeptContainer = document.getElementById("rezept-container");
const zutatenContainer = document.getElementById("zutaten-container");
const listItem = document.createElement("p");

searchInput.addEventListener("input", () => {
  rezeptSuche(rezeptContainer, listItem);
});

async function rezeptSuche(rezeptContainer, listItem) {
  const input = { name: searchInput.value };

  zutatenContainer.innerHTML = "";
  rezeptContainer.innerHTML = "";

  const response = await fetchData("/rezept-suche", input);

  const rezepte = await response.json();

  for (const rezept of rezepte) {
    listItem.dataset.rezeptId = rezept.id_Rezept;

    listItem.textContent = rezept.Name;
    rezeptContainer.appendChild(listItem);

    listItem.onclick = async (e) => {
      e.preventDefault();
      rezeptContainer.innerHTML = "";

      searchInput.dataset.id = listItem.dataset.rezeptId;
      searchInput.value = listItem.textContent;

      const rezeptId = {
        rezept_id: searchInput.dataset.id,
      };

      getRezept(rezeptId);
    };
  }
}

async function getRezept(id) {
  const response = await fetchData("/rezept-ausgewaehlt", id);

  const rezeptFromDB = await response.json();

  const rezeptImage = document.createElement("img");
  const rezeptName = document.createElement("label");
  const rezeptBeschreibung = document.createElement("label");

  rezeptImage.src = rezeptFromDB[0].Pfad_Bild;
  rezeptName.textContent = rezeptFromDB[0].Name;
  rezeptBeschreibung.textContent = `Beschreibung:  ${rezeptFromDB[0].Beschreibung}`;

  rezeptContainer.appendChild(rezeptImage);
  rezeptContainer.appendChild(rezeptName);
  rezeptContainer.appendChild(rezeptBeschreibung);

  getZutaten(rezeptFromDB);
}

function getZutaten(rezeptFromDB) {
  const labelInfoForZutaten = document.createElement("h3");
  labelInfoForZutaten.textContent = "Folgende Zutaten sind vorhanden:";
  zutatenContainer.appendChild(labelInfoForZutaten);

  for (const zutat of rezeptFromDB) {
    const labelForZutaten = document.createElement("p");
    labelForZutaten.textContent = zutat.Zutaten;
    zutatenContainer.appendChild(labelForZutaten);
  }
}

async function fetchData(uri, data) {
  const response = await fetch(uri, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });

  return response;
}
