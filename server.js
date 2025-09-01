const express = require("express");
const session = require('express-session');
const cors = require('cors');
const { Client } = require('pg');
const Socket = require("socket.io");
const bodyParser = require('body-parser');
const PORT = 5000;
const app = express();
const path = require('path'); // Agrega esta línea
const server = require("http").createServer(app);
const usersMap = new Map();
const io = Socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
const users = [];
//DATABASE
const connection = new Client({
  user: 'gchat',
  host: 'dpg-coml2ja1hbls73f5n3k0-a.oregon-postgres.render.com',
  database: 'gchat',
  password: '5Iw8L0X7E3tfthq7NCJgOcX8VVfk5baQ',
  port: 5432, // Puerto predeterminado de PostgreSQL
  ssl: {
    rejectUnauthorized: false // Opciones adicionales para configurar SSL/TLS
  }
});
connection.connect()
  .then(() => console.log('Conexión exitosa a PostgreSQL'))
  .catch(err => console.error('Error al conectar a PostgreSQL', err));


app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/html',express.static('html'));
app.use('/css',express.static('css'));
app.use('/js',express.static('js'));
app.use(session({
  secret: 'HERDMYRPVF', // Clave secreta para firmar la cookie de sesión
  resave: false, // No vuelvas a guardar la sesión si no hay cambios
  saveUninitialized: false // No guarde sesiones no inicializadas
}));

app.get('/', (req, res) => {
  // Envía el archivo 'index.html' como respuesta
  res.sendFile(path.join(__dirname, 'html', 'LogIn.html'));
});
//Ruta para obtener html conver
app.post("/conver", (req, res) => {
  const { id_usuario } = req.body;

  // Consulta SQL para obtener las conversaciones con los nombres de usuario
  const consultaConversaciones = `
  SELECT c.id AS id_conver, c.usuario1 AS id_usuario1, u1.username AS nombre_usuario1, c.usuario2 AS id_usuario2, u2.username AS nombre_usuario2
  FROM conver c
  INNER JOIN users u1 ON c.usuario1 = u1.id
  INNER JOIN users u2 ON c.usuario2 = u2.id
  WHERE c.usuario1 = $1 OR c.usuario2 = $1
  `;

  connection.query(consultaConversaciones, [id_usuario], (error, resultados) => {
    if (error) {
      console.error('Error al buscar conversaciones:', error);
      res.status(500).json({ error: 'Error al buscar conversaciones' });
      return;
    }

    // Enviar las conversaciones encontradas como respuesta
    const conversaciones = resultados.rows;
    res.json(conversaciones);
  });
});

app.post("/mensajes", (req, res) => {
  const { id_conver } = req.body;
  // Consulta SQL para obtener los mensajes relacionados con el id_conver proporcionado
  const consultaMensajes = `
    SELECT *
    FROM mensajes
    WHERE conversacion_id = $1
  `;

  connection.query(consultaMensajes, [id_conver], (error, resultados) => {
    if (error) {
      console.error('Error al buscar mensajes:', error);
      res.status(500).json({ error: 'Error al buscar mensajes' });
      return;
    }

    // Enviar los mensajes encontrados como respuesta
    const mensajes = resultados.rows;
    res.json(mensajes);
  });
});

// Ruta para el registro de cuentas
app.post("/registrar", (req, res) => {
  const { email, username, password, fecha } = req.body;
  //OBTENCION DE DATOS DB
  connection.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
    if (error) {
      console.error('Error al verificar el correo electrónico:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    if (results.rows.length > 0) {
      // El correo electrónico ya está registrado
      res.status(400).json({ error: 'El correo electrónico ya está registrado' });
      return;
    }

    //INSERCION DE DATOS CREAR CUENTA
    connection.query('INSERT INTO users (email,username,password,fechanac) VALUES ($1,$2,$3,$4)', [email,username,password,fecha], (error, results) => {
    if (error){
      console.error('Error al registrar usuario:',error);
      res.status(500).json({error: 'Error interno del servidor'});
      return;
    }
    res.json ({ message: 'Usuario registrado exitosamente' });
    });
  });
});

// Ruta para el inicio de sesion
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  connection.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
    const resultados = results.rows[0];
    if (error) {
      console.error('Error al buscar usuario en la base de datos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
      return;
    }

    if (results.rows.length === 0) {
      // No se encontró el usuario con el correo electrónico dado
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
      return;
    }

    const user = resultados;
    if (password !== user.password) {
      // Contraseña incorrecta
      res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos' });
      return;
    }
    // Inicio de sesión exitoso
    req.session.user = {
      id: user.id,
      username: user.username,
      email: email,
      fecha: user.fecha
    };
    res.json ({ message: 'Login exitoso',user: req.session.user});
  });
});

//Ruta para la busqueda de usuarios
app.post("/buscarUsuario", (req, res) => {
  const {searchText} = req.body;
  connection.query('SELECT * FROM users WHERE email = $1', [searchText], (err, result) => {
    if (err) {
      console.error('Error al buscar usuarios:', err.stack);
      res.status(500).json({ error: 'Error al buscar usuarios' });
      return;
    }
    const users = result.rows;
    res.json(users);
  });
});

//Ruta para agregar una conversacion
app.post("/conversacion", (req, res) => {
  const { id_usuario,id_agregado } = req.body;
  connection.query('SELECT * FROM conver WHERE (usuario1 = $1 AND usuario2=$2) OR (usuario2 = $1 AND usuario1=$2)', [id_usuario, id_agregado], (err, result) => {
    if (err) {
      console.error('Error al buscar usuarios:', err.stack);
      res.status(500).json({ error: 'Error al buscar usuarios' });
      return;
    }
    if(result.rows.length === 0){
      connection.query('INSERT INTO conver (usuario1,usuario2) VALUES ($1,$2)', [id_usuario,id_agregado], (error, results) => {
        if (error){
          console.error('Error al insertar el nuevo registro:', error);
          res.status(500).json({ error: 'Error al insertar el nuevo registro' });
          return;
        }   
        res.json ({ message: 'Conver registrado exitosamente',results});
        });
    }else{
      res.json({ mensaje: 'Ya existe un registro entre estos usuarios', });
    }
  });
});

function insertarMensajes(roomid,sala_guardar,id_user){
    //OBTENCION DE DATOS DB
    sala_guardar[roomid].forEach(sal => {
      connection.query('INSERT INTO mensajes (conversacion_id , remitente_id , mensaje , fecha_envio) VALUES ($1,$2,$3,$4)', [roomid,id_user,sal.mensaje,sal.fechaYHora], (error, results) => {
        if (error) {
          console.error('Error al guardar mensajes', error);
          res.status(500).json({ error: 'Error interno del servidor' });
          return;
        }
      });
    });
}
//const users = {}; // Objeto para almacenar la asociación entre IDs de socket y IDs de usuario
function buscarNumeroMap(mapa,numero){
  for (const [clave, valor] of mapa) {
    if (clave === numero) {
      return valor; // Devuelve la clave si encuentra el número
    }
  }
  return null; // Devuelve null si el número no se encuentra en el mapa
}

function obtenerFechaYHoraActual() {
  const ahora = new Date();
  const año = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const día = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  return `${año}-${mes}-${día} ${horas}:${minutos}:${segundos}`;
}

io.on('connection', socket => {
  socket.on('registerUser', userId => {
    // Asociar el ID de socket con el ID de usuario cuando un usuario se registra
    usersMap.set(userId, socket.id);
  });
  socket.on("createRoom", ({ roomId, userId1, userId2 }) => {
      // Buscar los IDs de socket asociados a los IDs únicos de los usuarios
      if(!(idCuarto===undefined) && !(id_user===undefined) && !(sala_guardar === undefined)){
        insertarMensajes(idCuarto,sala_guardar,id_user);
        idCuarto=undefined;
        id_user=undefined;
        sala_guardar=undefined;
      }
      const idSocket1 = buscarNumeroMap(usersMap,userId1);
      const idSocket2 = buscarNumeroMap(usersMap,userId2);

      // Verificar si se encontraron ambos IDs de socket
      if (idSocket1 && idSocket2) {
          // Ambos usuarios están conectados, unirlos a la misma sala
          socket.join(roomId);
          // Emitir un evento para notificar a los usuarios sobre la creación de la sala
          //io.to(roomId).emit("roomCreated", { roomId, idSocket1, idSocket2 });
      } else {
          // Al menos uno de los usuarios no está conectado
          console.log("Al menos uno de los usuarios no está conectado.");
          // Aquí puedes manejar este caso como desees, por ejemplo, emitir un mensaje de error
          socket.emit("roomCreationFailed", { message: "Al menos uno de los usuarios no está conectado." });
      }
  });
const salas = {};
let idCuarto;
let id_user;
let sala_guardar;
  socket.on("message", ({ message, roomId , nombreChat }) => {
    if (!salas[roomId]) {
      // Si la sala no existe, inicializarla como un nuevo arreglo vacío
      salas[roomId] = [];
    }
    // Guardar el mensaje en el arreglo correspondiente a esta sala
    let fechaYHoraActual = obtenerFechaYHoraActual();
    const mensajeCompleto = {
      mensaje: message,
      fechaYHora: fechaYHoraActual
    };
    salas[roomId].push(mensajeCompleto);
    // INSERTAR EN BD 
    //registerActivity(roomId);
    // En el servidor
    idCuarto = roomId
    id_user = nombreChat;
    sala_guardar = salas;
    io.to(roomId).emit("message", { message, roomId , nombreChat });
  });

  socket.on('disconnect', () => {
    // Eliminar la asociación del ID de socket cuando un usuario se desconecta
    if(!(idCuarto===undefined) && !(id_user===undefined) && !(sala_guardar === undefined)){
      insertarMensajes(idCuarto,sala_guardar,id_user);
      idCuarto=undefined;
      id_user=undefined;
      sala_guardar=undefined;
      salas[idCuarto] = undefined;
    }
    for (const [userId, socketId] of usersMap.entries()) {
      if (socketId === socket.id) {
        usersMap.delete(userId);
        break; // Salir del bucle después de eliminar la asociación
      }
    }
  });
});

server.listen(PORT, () => {
  console.log("listening on PORT: ", PORT);
  console.log("http://127.0.0.1:5000")
});