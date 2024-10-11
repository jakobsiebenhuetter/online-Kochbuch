// externe Module
const express = require('express');
const mySql = require('mysql2/promise');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mysqlStore = require('express-mysql-session');

// internes Node.js Modul
const path = require('path');

/* mysqlStore wichtig für die Speicherung der Sessions, in der Konstruktor Funktion MySQLStore 
kann alternativ eine eigene Tabelle für die Sessions erstellt werden.
Ansonsten wird eine Tabelle automatisch von express-mysql-session erstellt, Beispiel:
 
const options = {
	// Host name for database connection:
	host: 'localhost',
	// Port number for database connection:
	port: 3306,
	// Database user:
	user: 'session_test',
	// Password for the above database user:
	password: 'password',
	// Database name:
	database: 'session_test',
	// Whether or not to automatically check for and clear expired sessions:
	clearExpired: true,
	// How frequently expired sessions will be cleared; milliseconds:
	checkExpirationInterval: 900000,
	// The maximum age of a valid session; milliseconds:
	expiration: 86400000,
	// Whether or not to create the sessions database table, if one does not already exist:
	createDatabaseTable: true,
	// Whether or not to end the database connection when the store is closed.
	// The default value of this option depends on whether or not a connection was passed to the constructor.
	// If a connection object is passed to the constructor, the default value for this option is false.
	endConnectionOnClose: true,
	// Whether or not to disable touch:
	disableTouch: false,
	charset: 'utf8mb4_bin',
	schema: {
		tableName: 'sessions',
		columnNames: {
			session_id: 'session_id',
			expires: 'expires',
			data: 'data'
		}
	}
};
const sessionStore = new MySQLStore(options);
 */
const MySQLStore = mysqlStore(session);

const sessionStore = new MySQLStore({
    host:'localhost',
    port:'3306',
    user:'root',
    database: 'kochbuch',
    password:'jakob11@'
    /*,
    createDatabaseTable: true,

    schema: {
        tableName:'Benutzer-Sessions',
        columnNames: {
            session_id:'user_id',
            expires:'hours',
            data:'email'

        }
    }
        */

})

// Für das Speichern der Bilder 
const storageConfig = multer.diskStorage( {
    destination: function(req, file, cp) {
        cp(null, 'bilder_gerichte');
    },

    filename: function(req, file, cp) {
        cp(null, Date.now() + '-' + file.originalname)
    }
})

// MySQL connection erstellen
const db = mySql.createPool({
    host:'localhost',
    user:'root',
    database:'kochbuch',
    password:'jakob11@'
})


const app = express();

/**
 * 
 * multer besitzt jetzt die SpeicherKonfigurationen, und ist eingestellt wo die Bilder gespeichert werden im Filesystem und wie die files bezeichnet werden
 * zusätzlich haben wir auch dadurch die Information unter welchem Pfad die Bilder gespeichert werden.
 * upload wird als Middleware für den request.file verwendet. upload
 */
const upload = multer({storage: storageConfig})

// Middlewares
app.use(express.static('styles'));
app.use(express.static('images'));
app.use(express.static('scripts'))
app.use(express.urlencoded({extended:false}));

// Session Midleware
app.use(session({
    secret:'sicherer-Schlüssel',
    resave: false,
    saveUninitialized: false,  // wenn true dann wird bei jedem request ein leeres session erstellt. 
    store: sessionStore

}));

/**
 *  Für das speichern von den Bildern der Gerichte '/bilder_gerichte' ist ein Filter, weil der Pfad beim hochladen durch die storageConfig in der Datenbank gespeichert wird und
 * sonst die Bilder unter einem falschen Pfad sucht
 *  */
app.use('/bilder_gerichte',express.static('bilder_gerichte'))

// Middleware für gesendete JSON Datenformate aus API Anfragen, wird benötigt für die Decodierung,
// Formularanfragen werden traditionellerweise als url-encoded oder multipart/form-data bei file uploads
app.use(express.json());


// Middleware für die Verwendung von einer eher älteren template engine -> 'ejs'
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))


//##########################################################################################################################
// Und hier beginnen alle Routen

// Durch diesen Request wird eine Start Seite gerendert, wo man eine Liste von Gerichten mit Bildern sieht, weiter zu gerichte.ejs
app.get('/', async (request, response) => {

    const [rezept] = await db.query('SELECT * FROM kochbuch.rezept');

    response.render('gerichte', {countRezept: rezept.length, allRezepts: rezept});
})


app.get('/detailiertes-gericht/:id', async (request, response) => {

    const idRezept = request.params.id;

    const [rezept] = await db.query('SELECT * FROM kochbuch.rezept LEFT JOIN kochbuch.zutaten ON rezept.id_Rezept = zutaten.Zutat_id_Rezept WHERE id_Rezept = ?', [idRezept]);
 
    response.render('detailiertes', {rezept: rezept[0], zutaten: rezept});
})


app.get('/home', (request, response) => {
    if(!request.session.user) {
        return response.status(401).send('<h1>Du bist nicht eingelogt, bitte Loge dich ein wenn du bereits einen Account hast.</h1>');
    }
    response.render('index')
})


app.get('/admin', async (request,response) => {

    if(!request.session.user) {
        return response.status(401).render('401');
    }
    
    if (request.session.user.id === 'jakob') {
        
        // const rezeptId = request.query.rezeptId
        const [neuesRezept] = await db.query('SELECT * FROM rezept ORDER BY  id_Rezept DESC  Limit 1')
      
        return response.render('admin', {neuesRezept: neuesRezept[0]})
    }
    else {
       return response.status(401).send('<h1>Du bist kein Admin, bitte Loge dich mit dem Admin Account an.</h1>');
    }
 
})


app.post('/neues-rezept', upload.single('image-speise'), async (request,response) => {
    const data = request.body;
    const uploadImageSpeise = request.file;
    console.log(data)
    console.log(uploadImageSpeise)
    
    const [data_id_Rezept] = await db.query('INSERT INTO rezept (Name,Beschreibung,Dauer,Pfad_Bild) VALUES (?,?,?,?)',[data.rezeptname,data.rezeptbeschreibung,data.dauer, uploadImageSpeise.path]);
    const neueRezeptId = data_id_Rezept.insertId;
    response.redirect('/admin');
 //   response.redirect(`/admin?rezeptId=${neueRezeptId}`);
})

app.post("/zutaten-zum-rezept/:id", (request,response) => {

    const zutat = request.body.zutat;
    const menge = request.body.menge;
    const rezeptId = request.params.id

    db.query('INSERT INTO zutaten (Zutaten, Menge, zutaten.Zutat_id_Rezept) VALUES (?,?,?)',[zutat,menge,rezeptId])
    response.redirect('/admin')
})
app.get('/meine-gerichte', async (request,response) => {

    try {
        const [rezept] = await db.query('SELECT * FROM kochbuch.rezept');
    
        /* Darauf wurde verzichtet weil
         for (const r of rezept) {
            if(r.Pfad_Bild) {
             r.Pfad_Bild = r.Pfad_Bild.replace('bilder_gerichte\\', '')
             console.log(r)
         }}
       */
        
        response.render('gerichte', {countRezept: rezept.length, allRezepts: rezept});

    } catch(error) {
        console.log(error)
    }
})


app.post('/rezept-suche', async (request, response) => {
    const rezept = request.body.name;
    const [rezeptDb] = await db.query('SELECT * FROM rezept WHERE Name LIKE ?', [`%${rezept}%`])

    response.json(rezeptDb)

})


app.post('/rezept-ausgewaehlt', async (request, response) => {
    const rezept = request.body;
    console.log(rezept.rezept_id)
    const [rezeptDb] = await db.query('SELECT * FROM rezept LEFT JOIN zutaten ON rezept.id_Rezept = zutaten.Zutat_id_Rezept WHERE rezept.id_Rezept = ?', [rezept.rezept_id])
    console.log(rezeptDb)
    
    response.json(rezeptDb)
    
})



app.post("/rezept-loeschen", async (request, response)=> {
    const data = request.body;
    
    await db.query('DELETE FROM rezept WHERE id_Rezept = ?',[data.id])
})


app.post('/rezept-bearbeiten', (request,response)=> {
const updateData = request.body;
const preparedData = {
    name: updateData.name,
    beschreibung: updateData.beschreibung,
    id: updateData.id,
    alleZutaten: updateData.zutaten
}

db.query('UPDATE rezept SET Name = ?, Beschreibung = ?  WHERE id_Rezept = ?',[preparedData.name,preparedData.beschreibung,preparedData.id]);

for(zutat of preparedData.alleZutaten) {
   
    db.query('Update zutaten SET ZUTATEN = ? WHERE id_zutaten= ?',[zutat.zutat,zutat.zutaten_id])
}
response.send('Erfolgreich')
})

// Registrierung
app.get("/registrierung", (request, response) => {
    response.render('registrierung')
});

app.post("/registrierung-save-data", async(request,response) => {
const registrationData = request.body;
const formatedData = {
    benutzer: registrationData.benutzer,
    email:registrationData.email,
    confirm_email: registrationData['confirm-email'],
    password:registrationData.password
}

    if(!formatedData.email || !formatedData.confirm_email || !formatedData.password || formatedData.email !== formatedData.confirm_email || formatedData.password.trim().length < 4 || !formatedData.email.includes('@')) {
    console.log('Registrierung fehlgeschlagen');
    return response.redirect('/registrierung');
    }
    const hashedPassword = await bcrypt.hash(formatedData.password,12);

    const [existingUser] = await db.query('SELECT * FROM registrierung WHERE email = ?',[formatedData.email]);


    if(existingUser.length !== 0){

        if(existingUser[0].email === formatedData.email) {
            
            console.log('User mit der Email-Adresse existiert bereits')
            return response.redirect('/registrierung');
        }   
    }

// Noch überprüfen wie man das ganze Objekt in die SQL abfrage eingibt
await db.query('INSERT INTO kochbuch.registrierung (benutzer,email,confirm_email,passwort) VALUES (?,?,?,?)',[formatedData.benutzer,formatedData.email,formatedData.confirm_email,hashedPassword]);
response.redirect('/login');
})

//Login
app.get("/login", (request, response) => {
    response.render('login')
});

app.post('/login',async (request,response) => {
    const loginData = request.body;
    userEmail = loginData.email;
    userPassword = loginData.password;


    const [userData] = await db.query('SELECT * FROM kochbuch.registrierung WHERE email = ?', [userEmail])

    if(userData.length === 0) {
        console.log('Konnte nicht eingelogt werden')
       return response.redirect("/login");
    }

   
     const paswordsAreEqual = await bcrypt.compare(userPassword, userData[0].passwort)

      if(!paswordsAreEqual) {
        console.log('Konnte nicht eingelogt werden')
        return response.redirect('/login');
      }
        console.log('User ist eingeloggt')

        request.session.user = {id: userData[0].benutzer, email: userData[0].email}

        return response.redirect('/home')    
})

app.listen(3000, () => {
    console.log('Web-Server horcht auf Port 3000')})