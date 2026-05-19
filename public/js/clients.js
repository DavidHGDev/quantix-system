import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const URL_API = 'http://localhost:3007/api/clients'; // Ajusta si la ruta es otra

// DOM Elements
const clientsTableBody = document.getElementById('clientsTableBody');
const modal = document.getElementById('clientModal');
const clientForm = document.getElementById('clientForm');
const modalTitle = document.getElementById('modalTitle');
const formError = document.getElementById('formError');

document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    
    // Controles del Menú
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

// ==========================================
// R: READ (LEER CLIENTES)
// ==========================================
async function cargarClientes() {
    try {
        const respuesta = await fetch(URL_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("Error al cargar clientes");

        const clientes = await respuesta.json();
        dibujarTabla(clientes);
    } catch (error) {
        console.error(error);
    }
}

function dibujarTabla(clientes) {
    clientsTableBody.innerHTML = ''; 
    
    if(clientes.length === 0) {
        clientsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay clientes registrados</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><span style="font-weight: bold; color: var(--primary-color);">${cliente.tipoDocument}</span></td>
            <td>${cliente.document}</td>
            <td><strong>${cliente.name}</strong></td>
            <td>${cliente.phone || '<span class="text-muted">-</span>'}</td>
            <td>${cliente.email || '<span class="text-muted">-</span>'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="abrirModalEdicion(${cliente.id})" title="Editar">✏️</button>
                <button class="action-btn btn-delete" onclick="eliminarCliente(${cliente.id})" title="Eliminar">🗑️</button>
            </td>
        `;
        clientsTableBody.appendChild(fila);
    });
}

// ==========================================
// C & U: CREATE Y UPDATE
// ==========================================
document.getElementById('btnNewClient').addEventListener('click', () => {
    clientForm.reset();
    document.getElementById('clientId').value = ''; 
    modalTitle.textContent = 'Nuevo Cliente';
    formError.style.display = 'none';
    modal.classList.add('active');
});

window.abrirModalEdicion = async (id) => {
    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cliente = await respuesta.json();

        // Llenamos el formulario con los datos exactos del esquema
        document.getElementById('clientId').value = cliente.id;
        document.getElementById('tipoDocument').value = cliente.tipoDocument;
        document.getElementById('document').value = cliente.document;
        document.getElementById('name').value = cliente.name;
        document.getElementById('phone').value = cliente.phone || '';
        document.getElementById('email').value = cliente.email || '';
        
        modalTitle.textContent = 'Editar Cliente';
        formError.style.display = 'none';
        modal.classList.add('active');
    } catch (error) {
        alert("Error al obtener los datos del cliente");
    }
};

const cerrarModal = () => modal.classList.remove('active');
document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
document.getElementById('btnCancel').addEventListener('click', cerrarModal);

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';
    
    const formData = new FormData(clientForm);
    const datos = Object.fromEntries(formData);
    const idCliente = datos.id; 

    // Limpiamos strings vacíos para que no fallen las validaciones de Prisma (ej. teléfono vacío en vez de null)
    if (!datos.phone) delete datos.phone;
    if (!datos.email) delete datos.email;

    const metodoHTTP = idCliente ? 'PATCH' : 'POST';
    const urlFinal = idCliente ? `${URL_API}/${idCliente}` : URL_API;

    try {
        const respuesta = await fetch(urlFinal, {
            method: metodoHTTP,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            // Aquí atrapará el error de Prisma si intentas registrar un documento que ya existe
            formError.textContent = resultado.message || (resultado.errors ? resultado.errors[0].message : "Error al guardar");
            formError.style.display = 'block';
            return;
        }

        cerrarModal();
        cargarClientes(); 
        alert(`Cliente ${idCliente ? 'actualizado' : 'registrado'} exitosamente.`);

    } catch (error) {
        formError.textContent = "Error de conexión con el servidor";
        formError.style.display = 'block';
    }
});

// ==========================================
// D: DELETE
// ==========================================
window.eliminarCliente = async (id) => {
    if (!confirm("¿Eliminar definitivamente a este cliente? Podría fallar si tiene ventas asociadas.")) return;

    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respuesta.ok) {
            cargarClientes();
        } else {
            const errorData = await respuesta.json();
            // Prisma lanzará error de Foreign Key Constraint si el cliente ya tiene facturas.
            // Es buena idea avisarle al usuario por qué no puede borrarlo.
            alert(errorData.message || "No se puede eliminar el cliente porque ya tiene ventas o créditos registrados.");
        }
    } catch (error) {
        alert("Error de conexión");
    }
};