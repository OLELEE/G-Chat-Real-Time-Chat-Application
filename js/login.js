document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = {
      email: document.getElementById('email').value,
      password: document.getElementById('password').value
    };

    axios.post('https://g-chat-vyix.onrender.com/login', formData)
      .then(response => {
        if(response.data.user){
          const userId = response.data.user.id;
          const userName = response.data.user.username;
          const userData = {id: userId, name: userName}
          localStorage.setItem('user', JSON.stringify(userData));
          console.log("ACCION:",userData)
          window.location.href = "../html/index.html"; // Redirigir a index
        }else {
          // Si la respuesta no contiene datos del usuario
          console.error('No se recibieron datos del usuario en la respuesta');
          alert('No se pudieron obtener los datos del usuario');
        }
      })
      .catch(error => {
        console.error(error);
        if (error.response) {
          alert(error.response.data.error);
        } else {
          alert("Error de red o error no manejado");
        }
      });
  });