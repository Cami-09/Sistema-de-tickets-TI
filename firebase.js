<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Tickets TI PRO</title>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<!-- Iconos -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<style>
body{margin:0;font-family:Arial;background:#f1f5f9;}

header{
background:#0f172a;
color:white;
padding:15px;
display:flex;
justify-content:space-between;
align-items:center;
}

#login{
height:100vh;
display:flex;
justify-content:center;
align-items:center;
flex-direction:column;
}

#login button{
padding:12px 20px;
background:#3b82f6;
color:white;
border:none;
border-radius:10px;
font-size:16px;
cursor:pointer;
}

#dashboard{display:none;padding:25px;}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:20px;
}

.card{
background:white;
padding:25px;
border-radius:15px;
text-align:center;
cursor:pointer;
transition:.3s;
box-shadow:0 5px 15px rgba(0,0,0,0.1);
}

.card:hover{
transform:translateY(-5px);
box-shadow:0 10px 25px rgba(0,0,0,0.2);
}

.card i{
font-size:40px;
color:#2563eb;
margin-bottom:10px;
}

.modulo{display:none;}

.ticket{
background:white;
padding:15px;
margin:10px 0;
border-radius:10px;
box-shadow:0 3px 10px rgba(0,0,0,0.1);
}

input,textarea{
width:100%;
padding:8px;
margin:5px 0;
}

button{
padding:6px 10px;
border:none;
border-radius:6px;
cursor:pointer;
}

.volver{
background:#334155;
color:white;
}
</style>
</head>

<body>

<header>
<span>🎫 Sistema Tickets TI</span>
<button onclick="logout()">Salir</button>
</header>

<!-- LOGIN -->
<div id="login">
<h2>Iniciar sesión</h2>
<button onclick="login()">Entrar con Google</button>
</div>

<!-- DASHBOARD -->
<div id="dashboard">

<div id="panel" class="grid">

<div class="card" onclick="abrir('consultar')">
<i class="fas fa-search"></i>
<h3>Consultar Tickets</h3>
</div>

<div class="card" onclick="abrir('crear')">
<i class="fas fa-paper-plane"></i>
<h3>Crear Ticket</h3>
</div>

<div id="cardAdmin" class="card" onclick="abrir('admin')" style="display:none;">
<i class="fas fa-user-shield"></i>
<h3>Administración</h3>
</div>

</div>

<!-- CONSULTAR -->
<div id="consultar" class="modulo">
<button class="volver" onclick="volver()">⬅ Volver</button>
<h2>Mis Tickets</h2>
<div id="lista"></div>
</div>

<!-- CREAR -->
<div id="crear" class="modulo">
<button class="volver" onclick="volver()">⬅ Volver</button>
<h2>Crear Ticket</h2>
<input id="titulo" placeholder="Título">
<textarea id="desc" placeholder="Descripción"></textarea>
<button onclick="crearTicket()">Enviar</button>
</div>

<!-- ADMIN -->
<div id="admin" class="modulo">
<button class="volver" onclick="volver()">⬅ Volver</button>
<h2>Administrar Tickets</h2>
<div id="adminLista"></div>
</div>

</div>

<script>
// 🔥 CONFIG FIREBASE (LA TUYA)
firebase.initializeApp({
  apiKey: "AIzaSyDLucWQMOgeUx3e5H8AbFCml7AosZ2eVHw",
  authDomain: "sistema-de-tickets-ti-b12f5.firebaseapp.com",
  projectId: "sistema-de-tickets-ti-b12f5"
});

const auth = firebase.auth();
const db = firebase.firestore();

let user, rol;

// LOGIN (COMPATIBLE MÓVIL)
function login(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
}

// DETECTAR LOGIN
auth.getRedirectResult().then(result=>{
  if(result.user){
    user = result.user;
  }
});

auth.onAuthStateChanged(async u=>{
  if(!u) return;

  user = u;

  document.getElementById("login").style.display="none";
  document.getElementById("dashboard").style.display="block";

  // ROLES
  const ref = db.collection("roles").doc(user.email);
  let doc = await ref.get();

  if(user.email === "camicarmona1212@gmail.com"){
    await ref.set({rol:"admin"});
    doc = await ref.get();
  }

  if(!doc.exists){
    await ref.set({rol:"usuario"});
    doc = await ref.get();
  }

  rol = doc.data().rol;

  if(rol === "admin"){
    document.getElementById("cardAdmin").style.display="block";
  }

  cargarTickets();
});

// NAVEGACIÓN
function abrir(id){
  document.getElementById("panel").style.display="none";
  document.querySelectorAll(".modulo").forEach(m=>m.style.display="none");
  document.getElementById(id).style.display="block";
}

function volver(){
  document.getElementById("panel").style.display="grid";
  document.querySelectorAll(".modulo").forEach(m=>m.style.display="none");
}

// CREAR TICKET
async function crearTicket(){
  await db.collection("tickets").add({
    titulo:titulo.value,
    descripcion:desc.value,
    estado:"abierto",
    usuario:user.email,
    fecha:new Date()
  });

  alert("Ticket creado");
  titulo.value="";
  desc.value="";
}

// LISTAR
function cargarTickets(){
  db.collection("tickets").onSnapshot(snap=>{
    lista.innerHTML="";
    adminLista.innerHTML="";

    snap.forEach(doc=>{
      const t = doc.data();
      const id = doc.id;

      if(rol==="usuario" && t.usuario !== user.email) return;

      const html = `
      <div class="ticket">
        <b>${t.titulo}</b><br>
        ${t.descripcion}<br>
        Estado: ${t.estado}<br>

        ${rol==="admin" ? `
        <button onclick="estado('${id}','proceso')">Proceso</button>
        <button onclick="estado('${id}','cerrado')">Cerrar</button>
        <button onclick="eliminar('${id}')">Eliminar</button>
        ` : ""}
      </div>
      `;

      lista.innerHTML += html;
      adminLista.innerHTML += html;
    });
  });
}

// ACCIONES ADMIN
function estado(id,estado){
  db.collection("tickets").doc(id).update({estado});
}

function eliminar(id){
  if(confirm("Eliminar ticket?")){
    db.collection("tickets").doc(id).delete();
  }
}

// LOGOUT
function logout(){
  auth.signOut();
  location.reload();
}
</script>

</body>
</html>
