const messageform = document.querySelector(".chatbox form");
//const messageList = document.querySelector("#messagelist");
const chatboxinput = document.querySelector(".chatbox input");
const socket = io("https://g-chat-vyix.onrender.com");
//http://localhost:5000
let users = [];
let messages = [];
let isUser = "";
const texto='';
const userDataString = localStorage.getItem('user');
const userData = JSON.parse(userDataString);

document.addEventListener('DOMContentLoaded', function() {
  // Realiza una solicitud GET al servidor para obtener los textos
  //const userId = localStorage.getItem('id');
  //if(!userId){
  //  window.location.href = 'index.html';
 // }
const id_usuario = userData.id;
const userId = id_usuario; // Aquí debes proporcionar el ID único del usuario
socket.emit('registerUser', userId);
axios.post('https://g-chat-vyix.onrender.com/conver', { id_usuario })
  .then(response => {
    const conversaciones = response.data;
    generateConver(conversaciones,id_usuario);
  })
  .catch(error => {
    console.error("Error al obtener las conversaciones:", error);
  });

});
// Cuando se haga clic en el botón de desconexión
document.getElementById("disconnectButton").addEventListener("click", function() {
  socket.disconnect();
  localStorage.clear();
  window.location.href = '../html/LogIn.html';
});

document.getElementById("borrarButton").addEventListener("click", function() {
  socket.disconnect();
  localStorage.clear();
  window.location.href = '../html/LogIn.html';
});

document.getElementById("form-chats").addEventListener("submit", function(event) {
  event.preventDefault(); // Previene el comportamiento por defecto de enviar el formulario

  // Obtener el valor del input de búsqueda
  var searchTerm = document.getElementById("texto-chats").value.toLowerCase();

  // Obtener todos los elementos de la lista
  var buttons = document.querySelectorAll("#converUsuario button");

  // Recorrer los elementos de la lista y mostrar u ocultar según el término de búsqueda
  buttons.forEach(function(button) {
    var text = button.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      button.style.display = "block"; // Mostrar el botón si contiene el término de búsqueda
    } else {
      button.style.display = "none"; // Ocultar el botón si no contiene el término de búsqueda
    }
  });
});


document.getElementById("searchForm").addEventListener("submit",function (event) {
  event.preventDefault();
  const texto = {
    searchText: document.getElementById('searchInput').value
  };
  axios.post('https://g-chat-vyix.onrender.com/buscarUsuario', texto)
  .then(response => {
    const users = response.data;
    generateHTML(users);
  })
  .catch(error => {
    console.error("Error al buscar usuarios:", error);
  });
});

function crearArreglo(userId1,userId2, roomId){
  //CREAR UNA SALA DE CHAT socket.join
  socket.emit("createRoom", { roomId, userId1, userId2 });
}

function renderizarMensajes(render,id_remitente){
  let sender;
  const dateStrings ={};
  render.forEach(rende => {
    dateStrings[rende.id] = rende.fecha_envio;
  });
  const dateArray = Object.entries(dateStrings);
  dateArray.sort((a, b) => new Date(a[1]) - new Date(b[1]));

  dateArray.forEach(([id, date]) => {
    render.forEach(rend => {
       const texto = id;
       const numero = parseInt(texto);
        if(numero === rend.id){
          if(rend.remitente_id === id_remitente){
            sender = false;
          }else{
            sender = true;
          }
          const messageList = document.getElementById("messageList");
          const messageClass = sender ? "sender" : "receiver";
          const messageElement = document.createElement("li");
          messageElement.classList.add("message", messageClass);
          messageElement.textContent = `${rend.mensaje}`;
          messageList.appendChild(messageElement);
        }
      
    });
  });
}

function obtenerMensajes(id_conver,id_remitente){
  const mens = {
    id_conver: id_conver
  };
  axios.post("https://g-chat-vyix.onrender.com/mensajes", mens)
  .then(response => {
    console.log("Datos mensajes enviados correctamente:");
    // Aquí puedes realizar cualquier otra acción después de enviar los datos
    const render = response.data;

    renderizarMensajes(render,id_remitente);
  })
  .catch(error => {
    console.error("Error al enviar los datos de mensajes:", error);
  });
}

let boton1 = 0;
let nombreChat;
let ban;

function crearHTML(id_conver,id_us,nombre_us,idReemplazo){
  const comentarioElement = document.createElement('button');
  comentarioElement.classList.add('mensaje','list-group-item','list-group-item-action','list-group-item-danger');
  comentarioElement.id=id_conver;
  comentarioElement.setAttribute("name", idReemplazo);
  const usuarioElement = document.createElement('div');
  usuarioElement.classList.add('usuario');
  const fechaElement = document.createElement('div');
  fechaElement.classList.add('fecha');
  usuarioElement.textContent = `${nombre_us} `;
  fechaElement.textContent = `Da click para ingresar`;
  comentarioElement.appendChild(usuarioElement);
  usuarioElement.appendChild(fechaElement);
  comentarioElement.addEventListener("click", function() {
    const messageList = document.getElementById("messageList");
    messageList.textContent = "";
    const miInput = document.getElementById('cuadro-texto');
    const miBoton = document.getElementById('boton-enviar');
    const enlace = document.getElementById("a_nombre");
    let nn = this.textContent;
    nn = nn.split(" ")[0];
    enlace.textContent = nn;
    miInput.disabled = false;
    miBoton.disabled = false;
    const texto = this.name;
    const numero = parseInt(texto.match(/\d+/)[0]);
    const cualquierCosa = numero;
    boton1 = this.id;
    nombreChat = cualquierCosa;
    crearArreglo(userData.id,cualquierCosa,this.id);
    obtenerMensajes(this.id, userData.id);
  });
  document.getElementById('converUsuario').appendChild(comentarioElement);
  return;
}

function generateConver(conversaciones,id_original){
  conversaciones.forEach(conv => {
    if(conv.id_usuario1===id_original)
    {
      crearHTML(conv.id_conver,conv.id_usuario2,conv.nombre_usuario2,conv.id_usuario1);
    }
    else if(conv.id_usuario2===id_original)
    {
      crearHTML(conv.id_conver,conv.id_usuario1,conv.nombre_usuario1,conv.id_usuario2);
    }else{
      console.log("ERROR FATAL DE CONVER, NO DEBERIA PASAR")
    }
  });
}

function generateHTML(users) {
  users.forEach(texto => {
    const comentarioElement = document.createElement('button');
    comentarioElement.classList.add('mensaje','list-group-item','list-group-item-action','list-group-item-danger');
    comentarioElement.id=texto.id;
    const usuarioElement = document.createElement('div');
    usuarioElement.classList.add('usuario');
    const fechaElement = document.createElement('div');
    fechaElement.classList.add('fecha');
    usuarioElement.textContent = `${texto.username} `;
    fechaElement.textContent = `${texto.email}`;
    comentarioElement.appendChild(usuarioElement);
    usuarioElement.appendChild(fechaElement);
    comentarioElement.addEventListener("click", function() {
      const botonTexto = this.textContent;
      const idBoton = this.id;
      texto = `${botonTexto} ${idBoton}`;
      crearConv(texto)
      location.reload();

    });
    document.getElementById('usuariosEncontrados').appendChild(comentarioElement);

  });
}

function crearConv(texto) {
  const partes = texto.split(" ");
  const ag = partes[2];
  const datos = {
    id_usuario: userData.id,
    id_agregado: ag
  };
axios.post("https://g-chat-vyix.onrender.com/conversacion", datos)
  .then(response => {
    console.log("Datos enviados correctamente:", response.data);
    // Aquí puedes realizar cualquier otra acción después de enviar los datos
  })
  .catch(error => {
    console.error("Error al enviar los datos:", error);
  });
}

document.getElementById("cerrarBuscar").addEventListener("click", function() {
  const contenidoGenerado = document.getElementById("usuariosEncontrados");
  contenidoGenerado.innerHTML = "";
  contador = 1;
});

socket.on("message", ({ message, roomId , nombreChat }) => {
  // Actualizar la interfaz de usuario para mostrar el mensaje
  if(nombreChat===userData.id){
    ban = false
  }else{
    ban=true;
  }
  updateMessages(nombreChat , message , ban);
});

socket.on("roomCreated", ({ roomId, idSocket1, idSocket2 }) => {
  // Realizar alguna acción en respuesta a la creación de la sala
  // Por ejemplo, mostrar un mensaje al usuario
  alert("¡La sala ha sido creada!");
});

messageform.addEventListener("submit", messageSubmitHandler);

function updateMessages(user,message,isSender) {
  const messageList = document.getElementById("messageList");
  const messageClass = isSender ? "sender" : "receiver";
  const messageElement = document.createElement("li");
  messageElement.classList.add("message", messageClass);
  messageElement.textContent = `${message}`;
  messageList.appendChild(messageElement);
}

function messageSubmitHandler(e) {
  e.preventDefault();
  const roomId = boton1;
  let message = chatboxinput.value;
  // En el lado del cliente
  socket.emit("message", { message, roomId , nombreChat });
  chatboxinput.value = "";
}
