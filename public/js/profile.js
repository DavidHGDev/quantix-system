import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const URL_API = 'http://localhost:3007/api/users';

// ==========================================
// 1. IDENTIFICACIÓN
// ==========================================
function obtenerDatosDelToken() {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodificado = JSON.parse(atob(payloadBase64));
        return { id: decodificado.id, role: decodificado.role }; 
    } catch (error) { return null; }
}

const datosToken = obtenerDatosDelToken();
if (!datosToken) cerrarSesion();

let idActualizando = datosToken.id; // Objetivo inicial: Yo mismo

// ==========================================
// 2. ELEMENTOS DEL DOM
// ==========================================
const profileForm = document.getElementById('profileForm');
const formError = document.getElementById('formError');
const btnSaveProfile = document.getElementById('btnSaveProfile');
const avatarInitials = document.getElementById('avatarInitials');
const profileFullName = document.getElementById('profileFullName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const pageTitle = document.querySelector('.page-title');
const profileCard = document.getElementById('profileCard');

// Elementos Admin
const adminSearchContainer = document.getElementById('adminSearchContainer');
const adminUserSearch = document.getElementById('adminUserSearch');
const adminUserOptions = document.getElementById('adminUserOptions');
const roleGroup = document.getElementById('roleGroup');
const roleSelect = document.getElementById('role');

let timeoutUsuarios;

// ==========================================
// 3. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Si soy Admin, habilito el panel de búsqueda y el grupo de rol
    if (datosToken.role === 'ADMIN') {
        adminSearchContainer.style.display = 'block';
        roleGroup.style.display = 'block';
    } else {
        const menuUsuarios = document.getElementById('menuUsuarios');
        if (menuUsuarios) menuUsuarios.style.display = 'none';
    }

    cargarPerfil(idActualizando);
    
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

// ==========================================
// 4. BUSCADOR DINÁMICO (MODO DIOS)
// ==========================================
if (adminUserSearch) {
    adminUserSearch.addEventListener('input', (e) => {
        clearTimeout(timeoutUsuarios);
        const texto = e.target.value.trim();
        if (texto.length === 0) return adminUserOptions.innerHTML = '';
        if (/^\[\d+\]/.test(texto)) return;

        timeoutUsuarios = setTimeout(async () => {
            try {
                const res = await fetch(`${URL_API}/search?q=${texto}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (res.ok) {
                    const usuarios = await res.json();
                    adminUserOptions.innerHTML = ''; 
                    usuarios.forEach(u => {
                        const option = document.createElement('option');
                        option.value = `[${u.id}] ${u.name} ${u.lastName || ''} - ${u.email}`;
                        adminUserOptions.appendChild(option);
                    });
                }
            } catch (error) {}
        }, 300);
    });

    adminUserSearch.addEventListener('change', () => {
        const match = adminUserSearch.value.match(/^\[(\d+)\]/);
        if (match) {
            idActualizando = parseInt(match[1]);
            cargarPerfil(idActualizando);
            adminUserSearch.value = '';
            adminUserSearch.blur();
        }
    });
}

// ==========================================
// 5. CARGAR DATOS
// ==========================================
async function cargarPerfil(idObjetivo) {
    try {
        const respuesta = await fetch(`${URL_API}/${idObjetivo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("No tienes permiso para ver este perfil.");

        const user = await respuesta.json();

        // Cabecera
        profileFullName.textContent = `${user.name} ${user.lastName || ''}`;
        profileEmail.textContent = user.email;
        profileRole.textContent = user.role;
        avatarInitials.textContent = user.name.charAt(0).toUpperCase();

        // Formulario
        document.getElementById('name').value = user.name;
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email;
        
        // Manejo del select de Rol
        if (roleSelect) {
            roleSelect.value = user.role;
            // Bloqueamos cambio de rol si se edita a sí mismo (seguridad)
            roleSelect.disabled = (idObjetivo === datosToken.id);
        }

        // Feedback visual de edición
        if (idObjetivo !== datosToken.id) {
            pageTitle.textContent = `👑 Editando a: ${user.name}`;
            profileCard.style.border = "2px solid var(--primary-color)";
        } else {
            pageTitle.textContent = "Configuración de Cuenta";
            profileCard.style.border = "none";
        }

    } catch (error) {
        alert(error.message);
        window.location.href = 'dashboard.html'; 
    }
}

// ==========================================
// 6. GUARDAR (PATCH)
// ==========================================
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = 'Guardando...';
    
    const formData = new FormData(profileForm);
    const datos = Object.fromEntries(formData);
    
    if (!datos.password) delete datos.password;
    if (roleSelect && roleSelect.disabled) delete datos.role;

    try {
        const respuesta = await fetch(`${URL_API}/${idActualizando}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.message || (resultado.errors ? resultado.errors[0].message : "Error"));

        alert("¡Datos actualizados con éxito!");
        cargarPerfil(idActualizando); 
        document.getElementById('password').value = '';

    } catch (error) {
        formError.textContent = error.message;
        formError.style.display = 'block';
    } finally {
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = '💾 Guardar Cambios';
    }
});