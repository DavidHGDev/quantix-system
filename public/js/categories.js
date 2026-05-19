import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const API_URL = 'http://localhost:3007/api/categories';

const tableBody = document.getElementById('categoryTableBody');
const modal = document.getElementById('categoryModal');
const form = document.getElementById('categoryForm');
const searchInput = document.getElementById('categorySearch');

let todasLasCategorias = []; // Cache local para búsqueda rápida

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();

    // Eventos
    document.getElementById('btnNewCategory').addEventListener('click', () => abrirModal());
    document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
    document.getElementById('btnCancel').addEventListener('click', cerrarModal);
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    
    // Búsqueda dinámica local
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtradas = todasLasCategorias.filter(c => 
            c.name.toLowerCase().includes(term) || 
            (c.description && c.description.toLowerCase().includes(term))
        );
        dibujarTabla(filtradas);
    });
});

async function cargarCategorias() {
    try {
        const res = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        todasLasCategorias = await res.json();
        dibujarTabla(todasLasCategorias);
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="5">Error al conectar con el servidor</td></tr>';
    }
}

function dibujarTabla(lista) {
    tableBody.innerHTML = '';
    if(lista.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No se encontraron categorías</td></tr>';
        return;
    }

    lista.forEach(cat => {
        // En tu backend, puedes usar include: { _count: { select: { products: true } } }
        const totalProds = cat._count?.products || 0; 
        
        tableBody.innerHTML += `
            <tr>
                <td>#${cat.id}</td>
                <td><strong>${cat.name}</strong></td>
                <td><span class="text-muted">${cat.description || 'Sin descripción'}</span></td>
                <td><span class="badge-info">${totalProds} Prods</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="abrirModal(${cat.id})">✏️</button>
                    <button class="action-btn btn-delete" onclick="eliminarCategoria(${cat.id})">🗑️</button>
                </td>
            </tr>`;
    });
}

window.abrirModal = async (id = null) => {
    form.reset();
    document.getElementById('categoryId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Categoría' : 'Nueva Categoría';

    if (id) {
        const cat = todasLasCategorias.find(c => c.id === id);
        if(cat) {
            document.getElementById('name').value = cat.name;
            document.getElementById('description').value = cat.description || '';
        }
    }
    modal.classList.add('active');
};

const cerrarModal = () => modal.classList.remove('active');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const datos = Object.fromEntries(new FormData(form));

    const metodo = id ? 'PATCH' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            cerrarModal();
            cargarCategorias();
        } else {
            const err = await res.json();
            alert("Error: " + err.message);
        }
    } catch (e) {
        alert("Error de conexión");
    }
});

window.eliminarCategoria = async (id) => {
    const cat = todasLasCategorias.find(c => c.id === id);
    if (cat._count?.products > 0) {
        alert(`No puedes eliminar "${cat.name}" porque tiene productos asociados. Mueve los productos a otra categoría primero.`);
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría ${cat.name}?`)) return;

    try {
        await fetch(`${API_URL}/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        cargarCategorias();
    } catch (e) { alert("Error al eliminar"); }
};