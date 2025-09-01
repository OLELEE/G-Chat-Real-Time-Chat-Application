document.getElementById('registroForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var email = document.getElementById("email").value;
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var fechaNac = document.getElementById("fechaNac").value;

    if (email === '' || username === '' || password === '' || fechaNac === '') {
        alert("Por favor complete todos los campos.");
        return;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Verificar si el correo electrónico tiene el formato correcto
    if (!emailRegex.test(email)) {
        alert("Por favor ingrese un correo electrónico válido.");
        return;
    }
    var fechaNacimiento = new Date(fechaNac);
    var fechaActual = new Date();
    var edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();

    // Verificar si el usuario ya cumplió años en el año actual
    var mesNacimiento = fechaNacimiento.getMonth();
    var diaNacimiento = fechaNacimiento.getDate();
    var mesActual = fechaActual.getMonth();
    var diaActual = fechaActual.getDate();
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
        edad--;
    }

    if (fechaNacimiento >= fechaActual || edad < 18) {
        alert("Por favor ingrese una fecha de nacimiento válida y asegúrese de tener al menos 18 años.");
        return;
    }
    const formData = {
      email: document.getElementById('email').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      fecha: document.querySelector('.datepicker').value
    };
    axios.post('https://g-chat-vyix.onrender.com/registrar', formData)
    .then(response => {
      console.log(response.data);
      console.log("EXITO");
      window.location.href = "../html/LogIn.html"; // Redirigir a VER
    })
    .catch(error => {
      console.error(error);
      if (error.response) {
       // Error de respuesta del servidor
       if (error.response.status === 400) {
         alert("El correo electrónico ya está registrado");
         document.getElementById('email').value = '';
       } else {
         alert("Error interno del servidor");
       }
     } else {  
       // Error de red o error no manejado
       alert("Error de red o error no manejado");
     }
      console.log("NADA");
      console.log(formData);
    });
   }); 