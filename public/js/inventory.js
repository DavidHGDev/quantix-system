import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const API_URL = 'http://localhost:3007/api/products';
const API_CATEGORIES = 'http://localhost:3007/api/categories';
const API_PROVIDERS = 'http://localhost:3007/api/providers';

// DOM
const inventoryTableBody = document.getElementById('inventoryTableBody');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const categorySelect = document.getElementById('categoryId');
const providerSelect = document.getElementById('providerIds');

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarRelaciones(); // Cargar categorías y proveedores para los selectores
    
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('btnNewProduct').addEventListener('click', () => abrirModal());
    document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
    document.getElementById('btnCancel').addEventListener('click', cerrarModal);
});

async function cargarRelaciones() {
    try {
        const [resCat, resProv] = await Promise.all([
            fetch(API_CATEGORIES, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(API_PROVIDERS, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const categorias = await resCat.json();
        const proveedores = await resProv.json();

        categorySelect.innerHTML = '<option value="">Seleccione categoría...</option>';
        categorias.forEach(c => categorySelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);

        providerSelect.innerHTML = '';
        proveedores.forEach(p => providerSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
    } catch (e) { console.error("Error cargando selects", e); }
}

async function cargarProductos() {
    try {
        const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        const productos = await res.json();
        dibujarTabla(productos);
    } catch (e) { inventoryTableBody.innerHTML = 'Error al cargar datos.'; }
}

function dibujarTabla(productos) {
    inventoryTableBody.innerHTML = '';
    productos.forEach(p => {
        const stockClass = p.stock <= 5 ? 'stock-low' : 'stock-ok';
        const tagsProveedores = p.providers?.map(prov => `<span class="provider-tag">${prov.name}</span>`).join('') || '';

        inventoryTableBody.innerHTML += `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.nameProduct}</strong></td>
                <td>${p.category?.name || 'S/N'}</td>
                <td>$${p.price.toLocaleString()}</td>
                <td><span class="stock-badge ${stockClass}">${p.stock}</span></td>
                <td>${tagsProveedores}</td>
                <td>
                    <button class="action-btn btn-edit" onclick="abrirModal(${p.id})">✏️</button>
                    <button class="action-btn btn-delete" onclick="eliminarProducto(${p.id})">🗑️</button>
                </td>
            </tr>`;
    });
}

window.abrirModal = async (id = null) => {
    productForm.reset();
    document.getElementById('productId').value = id || '';
    document.getElementById('modalTitle').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
    
    if (id) {
        const res = await fetch(`${API_URL}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const p = await res.json();
        document.getElementById('nameProduct').value = p.nameProduct;
        document.getElementById('price').value = p.price;
        document.getElementById('stock').value = p.stock;
        categorySelect.value = p.categoryId;
        
        // Marcar proveedores seleccionados
        const idsProv = p.providers.map(prov => prov.id.toString());
        Array.from(providerSelect.options).forEach(opt => {
            opt.selected = idsProv.includes(opt.value);
        });
    }
    productModal.classList.add('active');
};

const cerrarModal = () => productModal.classList.remove('active');

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const formData = new FormData(productForm);
    const datos = Object.fromEntries(formData);
    
    // Convertir tipos de datos para Prisma
    datos.price = parseFloat(datos.price);
    datos.stock = parseInt(datos.stock);
    datos.categoryId = parseInt(datos.categoryId);
    // Capturar múltiples proveedores
    datos.providerIds = Array.from(providerSelect.selectedOptions).map(opt => parseInt(opt.value));

    const method = id ? 'PATCH' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (res.ok) { cerrarModal(); cargarProductos(); }
    } catch (e) { alert("Error al guardar"); }
});

window.eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    cargarProductos();
};