const sucheRezeptButton = document.getElementById("rezept-btn-suchen");
const deleteRezeptButton = document.getElementById("rezept-loeschen");
const rezeptSucheInput = document.getElementById("rezept-suche");
const rezeptBearbeitenButton = document.getElementById("bearbeiten-btn");
const zweitesFenster = document.getElementById("zweites-fenster-admin");
const zweitesFensterOeffnenButton = document.getElementById("zweites-fenster-oeffnen");
const zweitesFensterSchließenButton = document.getElementById("close");

rezeptBearbeitenButton.addEventListener("click", (e) => {
    e.preventDefault();
    updateRezept()});
    
sucheRezeptButton.addEventListener("click", rezeptSuche);
deleteRezeptButton.addEventListener("click", deleteRezept);
rezeptSucheInput.addEventListener("input", rezeptSuche);
zweitesFensterOeffnenButton.addEventListener("click", openWindow);
zweitesFensterSchließenButton.addEventListener("click", closeWindow);

const zutatenList = document.querySelector("#zutaten-bearbeiten-löschen div");
