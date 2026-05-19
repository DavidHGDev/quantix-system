const formLogin = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const btnLogin = document.getElementById('btnLogin');

formLogin.addEventListener('submit', async (event) => {
    event.preventDefault(); 

    // Resetear estados
    errorMessage.style.display = 'none';
    btnLogin.textContent = 'Autenticando...';
    btnLogin.disabled = true;

    try {
        const formData = new FormData(formLogin);
        const datosDelFormulario = Object.fromEntries(formData); 

        const respuesta = await fetch('http://localhost:3007/api/auth/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' 
            }, 
            body: JSON.stringify(datosDelFormulario)
        });

        const result = await respuesta.json();

        // Validar errores del backend (Zod o Credenciales inválidas)
        if (!respuesta.ok) {
            errorMessage.textContent = result.message || (result.errors ? result.errors[0].message : 'Error desconocido');
            errorMessage.style.display = 'block'; 
            return; 
        }

        // Éxito: Guardar token y redirigir
        sessionStorage.setItem('token', result.token); 
        window.location.href = '/dashboard.html'; 

    } catch (error) {
        console.error('Error crítico de red', error); 
        errorMessage.textContent = 'No se pudo conectar con el servidor.';
        errorMessage.style.display = 'block';
    } finally {
        btnLogin.textContent = 'Iniciar Sesión';
        btnLogin.disabled = false;
    }
});