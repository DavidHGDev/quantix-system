import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const API_URL = 'http://localhost:3007/api/providers';

const tableBody = document.getElementById('providerTableBody');
const modal = document.getElementById('providerModal');
const form = document.getElementById('providerForm');
const searchInput = document.getElementById('providerSearch');

let listaProveedores = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarProveedores();

    // Eventos
    document.getElementById('btnNewProvider').addEventListener('click', () => abrirModal());
    document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
    document.getElementById('btnCancel').addEventListener('click', cerrarModal);
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);

    // Búsqueda dinámica
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtrados = listaProveedores.filter(p => 
            p.name.toLowerCase().includes(term) || 
            (p.email && p.email.toLowerCase().includes(term))
        );
        dibujarTabla(filtrados);
    });
});

async function cargarProveedores() {
    try {
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        listaProveedores = await res.json();
        dibujarTabla(listaProveedores);
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6">Error al conectar con el servidor</td></tr>';
    }
}

function dibujarTabla(datos) {
    tableBody.innerHTML = '';
    if (datos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay proveedores registrados</td></tr>';
        return;
    }

    datos.forEach(p => {
        const numProds = p._count?.products || 0;

        tableBody.innerHTML += `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.name}</strong></td>
                <td>
                    ${p.phone ? `<a href="tel:${p.phone}" class="contact-link">📞 ${p.phone}</a>` : '<span class="text-muted">N/A</span>'}
                </td>
                <td>
                    ${p.email ? `<a href="mailto:${p.email}" class="contact-link">✉️ ${p.email}</a>` : '<span class="text-muted">N/A</span>'}
                </td>
                <td><span class="badge-products">${numProds} Items</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="abrirModal(${p.id})">✏️</button>
                    <button class="action-btn btn-delete" onclick="eliminarProveedor(${p.id})">🗑️</button>
                </td>
            </tr>`;
    });
}

window.abrirModal = (id = null) => {
    form.reset();
    document.getElementById('providerId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Proveedor' : 'Nuevo Proveedor';

    if (id) {
        const p = listaProveedores.find(item => item.id === id);
        if (p) {
            document.getElementById('name').value = p.name;
            document.getElementById('phone').value = p.phone || '';
            document.getElementById('email').value = p.email || '';
        }
    }
    modal.classList.add('active');
};

const cerrarModal = () => modal.classList.remove('active');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('providerId').value;
    const datos = Object.fromEntries(new FormData(form));

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            cerrarModal();
            cargarProveedores();
        } else {
            const err = await res.json();
            alert(err.message || "Error al procesar");
        }
    } catch (e) {
        alert("Error de conexión");
    }
});

window.eliminarProveedor = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            cargarProveedores();
        } else {
            alert("No se puede eliminar: es posible que tenga productos asociados.");
        }
    } catch (e) {
        alert("Error al eliminar");
    }
};