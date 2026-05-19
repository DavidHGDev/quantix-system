// ==========================================
// 1. EL GUARDIA DE SEGURIDAD (Protección de Ruta)
// ==========================================
// Apenas carga el archivo, verificamos si existe el token en la bóveda
const token = sessionStorage.getItem('token');

if (!token) {
    // Si no hay token, lo devolvemos al login INMEDIATAMENTE
    window.location.href = '/index.html';
}

// ==========================================
// 2. LÓGICA DE INTERFAZ (DOM)
// ==========================================
const sidebar = document.getElementById('sidebar');
const btnOpenMenu = document.getElementById('btnOpenMenu');
const btnCloseMenu = document.getElementById('btnCloseMenu');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const btnLogout = document.getElementById('btnLogout');

// Función para abrir el menú en móviles
btnOpenMenu.addEventListener('click', () => {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
});

// Función para cerrar el menú en móviles
const cerrarMenu = () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
};

btnCloseMenu.addEventListener('click', cerrarMenu);
sidebarOverlay.addEventListener('click', cerrarMenu); // Cierra si tocan lo oscuro

// Lógica de Cerrar Sesión
btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('token'); // Destruimos la llave
    window.location.href = '/index.html'; // Lo sacamos del sistema
});

// ==========================================
// 3. CARGA DINÁMICA DE DATOS (Simulación inicial)
// ==========================================
// Como ya tienes el token de JWT, podemos extraer información básica 
// (Si tu JWT guarda el rol y nombre, el backend te lo debió enviar en el JSON del login)
// Por ahora, simularemos que la API respondió correctamente para llenar la interfaz:

document.addEventListener('DOMContentLoaded', () => {
    // Aquí en el futuro haremos: const respuesta = await fetch('/api/inventario', { headers: {'Authorization': `Bearer ${token}`} })
    
    // Simulando datos del usuario logueado
    document.getElementById('userNameDisplay').textContent = "David Hernandez";
    document.getElementById('userRoleBadge').textContent = "ADMIN";

    // Mostrando el menú de usuarios SOLO si es ADMIN
    const rolActual = "ADMIN"; // Esto lo leeremos de tu JWT real luego
    if (rolActual === "ADMIN") {
        document.getElementById('menuUsuarios').style.display = 'block';
    }

    // Simulando carga de métricas
    document.getElementById('metricProducts').textContent = "1,245";
    document.getElementById('metricLowStock').textContent = "12";
    document.getElementById('metricClients').textContent = "340";

    // Simulando llenado de la tabla de inventario
    const tbody = document.getElementById('dataTableBody');
    tbody.innerHTML = `
        <tr>
            <td>#001</td>
            <td><strong>Laptop Lenovo ThinkPad E460</strong></td>
            <td>Tecnología</td>
            <td><span style="color: var(--success); font-weight: bold;">En Stock</span></td>
            <td><button style="border:none; background:transparent; cursor:pointer; color:var(--primary-color);">✏️ Editar</button></td>
        </tr>
        <tr>
            <td>#002</td>
            <td><strong>Monitor HP 24"</strong></td>
            <td>Periféricos</td>
            <td><span style="color: var(--warning); font-weight: bold;">Bajo (2 uds)</span></td>
            <td><button style="border:none; background:transparent; cursor:pointer; color:var(--primary-color);">✏️ Editar</button></td>
        </tr>
    `;
});