import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();

// ==========================================
// CONFIGURACIÓN DE RUTAS API
// ==========================================
const API_SALES = 'http://localhost:3007/api/sales';
const API_CLIENTS = 'http://localhost:3007/api/clients';
const API_PRODUCTS = 'http://localhost:3007/api/products';

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
// Generales
const salesTableBody = document.getElementById('salesTableBody');
const modal = document.getElementById('saleModal');
const quickClientModal = document.getElementById('quickClientModal');
const btnNewSale = document.getElementById('btnNewSale');
const formError = document.getElementById('formError');
const modalTitle = document.getElementById('modalTitle');

// Elementos del POS (Productos)
const ventaIdModificar = document.getElementById('ventaIdModificar');
const productSearch = document.getElementById('productSearch');
const productOptions = document.getElementById('productOptions');
const productQty = document.getElementById('productQty');
const btnAddItem = document.getElementById('btnAddItem');
const cartTableBody = document.getElementById('cartTableBody');
const saleTotalDisplay = document.getElementById('saleTotal');

// Elementos de Facturación (Clientes y Pago)
const clientSearch = document.getElementById('clientSearch');
const clientOptions = document.getElementById('clientOptions');
const isContadoCheck = document.getElementById('isContado');
const btnSaveSale = document.getElementById('btnSaveSale');

// ==========================================
// ESTADO GLOBAL Y ANTI-REBOTE (DEBOUNCE)
// ==========================================
let carritoActual = [];
let listaProductosBuscados = []; 
let listaClientesBuscados = [];
let timeoutProductos;
let timeoutClientes;

// ==========================================
// 1. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarVentas();
    
    // Controles Menú Lateral
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

// ==========================================
// 2. R: READ (HISTORIAL DE VENTAS)
// ==========================================
async function cargarVentas() {
    try {
        const res = await fetch(API_SALES, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) dibujarTablaVentas(await res.json());
    } catch (error) { console.error("Error conectando con ventas"); }
}

function dibujarTablaVentas(ventas) {
    salesTableBody.innerHTML = ''; 
    if(ventas.length === 0) return salesTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Aún no hay ventas registradas</td></tr>`;

    // Ordenar de la más reciente a la más antigua
    ventas.sort((a, b) => b.id - a.id).forEach(venta => {
        const fechaVenta = new Date(venta.fecha).toLocaleDateString();
        const estadoHTML = venta.status === 'ACTIVA' ? `<span class="badge-active">ACTIVA</span>` : `<span class="badge-anulada">ANULADA</span>`;
        const tipoPago = venta.isContado ? 'CONTADO' : 'CRÉDITO';

        const btnModificar = venta.status === 'ACTIVA'
            ? `<button class="action-btn btn-edit" onclick="prepararModificacion(${venta.id})" title="Modificar Factura">✏️</button>`
            : `<button class="action-btn" disabled style="opacity: 0.3" title="No se puede editar">🚫</button>`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>#${venta.id}</strong></td>
            <td>${fechaVenta} <br><small class="text-muted">${tipoPago}</small></td>
            <td>${venta.client?.name || 'Cliente Genérico'}</td>
            <td>${venta.user?.name || 'Sistema'}</td>
            <td style="color: var(--primary-color); font-weight: bold;">$${venta.saldoTotal.toLocaleString()}</td>
            <td>${estadoHTML}</td>
            <td>${btnModificar}</td>
        `;
        salesTableBody.appendChild(fila);
    });
}

// ==========================================
// 3. BUSCADOR DINÁMICO DE PRODUCTOS
// ==========================================
productSearch.addEventListener('input', (e) => {
    clearTimeout(timeoutProductos);
    const texto = e.target.value.trim();
    
    if (texto.length === 0) return productOptions.innerHTML = '';

    // 🛡️ EL ESCUDO REGEX: Evita borrar la memoria si el texto ya es una opción seleccionada
    if (/^\[\d+\]/.test(texto)) return; 

    timeoutProductos = setTimeout(async () => {
        try {
            const res = await fetch(`${API_PRODUCTS}/search?q=${texto}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                listaProductosBuscados = await res.json();
                productOptions.innerHTML = ''; 
                listaProductosBuscados.forEach(p => {
                    const option = document.createElement('option');
                    // Formato clave para que el Regex luego funcione: [ID] ...
                    option.value = `[${p.id}] ${p.nameProduct} - $${p.price.toLocaleString()} (Disp: ${p.stock})`;
                    productOptions.appendChild(option);
                });
            }
        } catch (error) {}
    }, 300);
});

// Añadir al Carrito
btnAddItem.addEventListener('click', () => {
    const textoBuscado = productSearch.value.trim();
    const qty = parseFloat(productQty.value);
    
    // 🛡️ Extraemos el ID numérico usando Regex
    const match = textoBuscado.match(/^\[(\d+)\]/);
    if (!match || qty <= 0) return alert("Selecciona un producto válido de la lista sugerida.");

    const pId = parseInt(match[1]);
    const producto = listaProductosBuscados.find(p => p.id === pId);
    
    if (!producto) return alert("Error de memoria temporal. Busca el producto nuevamente.");

    // Validar Stock
    const existIdx = carritoActual.findIndex(item => item.productId === pId);
    let planeado = qty;
    if (existIdx >= 0) planeado += carritoActual[existIdx].cantidadVendida;

    if (producto.stock < planeado) return alert(`⚠️ Stock insuficiente. Quedan ${producto.stock} unidades de ${producto.nameProduct}.`);

    if (existIdx >= 0) {
        carritoActual[existIdx].cantidadVendida += qty;
    } else {
        carritoActual.push({ 
            productId: pId, 
            nameProduct: producto.nameProduct, 
            precioVendido: producto.price, 
            cantidadVendida: qty 
        });
    }

    productSearch.value = ''; 
    productQty.value = '1';
    productSearch.focus();
    actualizarVistaCarrito();
});

window.eliminarItemCarrito = (index) => { 
    carritoActual.splice(index, 1); 
    actualizarVistaCarrito(); 
};

function actualizarVistaCarrito() {
    cartTableBody.innerHTML = '';
    let total = 0;
    
    carritoActual.forEach((item, index) => {
        const subtotal = item.precioVendido * item.cantidadVendida;
        total += subtotal;
        
        cartTableBody.innerHTML += `
            <tr>
                <td>${item.nameProduct}</td>
                <td>$${item.precioVendido.toLocaleString()}</td>
                <td>${item.cantidadVendida}</td>
                <td><strong>$${subtotal.toLocaleString()}</strong></td>
                <td><button type="button" class="action-btn btn-delete" onclick="eliminarItemCarrito(${index})">❌</button></td>
            </tr>`;
    });
    saleTotalDisplay.textContent = total.toLocaleString();
}

// ==========================================
// 4. BUSCADOR DINÁMICO DE CLIENTES
// ==========================================
clientSearch.addEventListener('input', (e) => {
    clearTimeout(timeoutClientes);
    const texto = e.target.value.trim();
    
    if (texto.length === 0) return clientOptions.innerHTML = '';

    // 🛡️ ESCUDO REGEX PARA CLIENTES
    if (/^\[\d+\]/.test(texto)) return; 

    timeoutClientes = setTimeout(async () => {
        try {
            const res = await fetch(`${API_CLIENTS}/search?q=${texto}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                listaClientesBuscados = await res.json();
                clientOptions.innerHTML = ''; 
                listaClientesBuscados.forEach(c => {
                    const option = document.createElement('option');
                    option.value = `[${c.id}] ${c.document} - ${c.name}`;
                    clientOptions.appendChild(option);
                });
            }
        } catch (error) {}
    }, 300);
});

// ==========================================
// 5. CREACIÓN RÁPIDA DE CLIENTES (Mini Modal)
// ==========================================
document.getElementById('btnOpenQuickClient').addEventListener('click', () => {
    document.getElementById('quickClientForm').reset();
    document.getElementById('quickClientError').style.display = 'none';
    quickClientModal.classList.add('active');
    document.getElementById('quickDoc').focus(); 
});

const cerrarQuickModal = () => quickClientModal.classList.remove('active');
document.getElementById('btnCloseQuickClient').addEventListener('click', cerrarQuickModal);
document.getElementById('btnCancelQuickClient').addEventListener('click', cerrarQuickModal);

document.getElementById('quickClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveQuickClient');
    const errorText = document.getElementById('quickClientError');
    
    const payload = {
        tipoDocument: document.getElementById('quickTipoDoc').value,
        document: document.getElementById('quickDoc').value,
        name: document.getElementById('quickName').value
    };

    try {
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const res = await fetch(API_CLIENTS, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.errors[0].message);

        // Autocompletar en el input de la venta
        clientSearch.value = `[${data.id}] ${data.document} - ${data.name}`;
        listaClientesBuscados.push(data); 
        
        cerrarQuickModal();

    } catch (error) {
        errorText.textContent = error.message;
        errorText.style.display = 'block';
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = 'Guardar y Usar';
    }
});

// ==========================================
// 6. C & U: CREAR Y MODIFICAR VENTAS (CHECKOUT)
// ==========================================
btnNewSale.addEventListener('click', () => {
    document.getElementById('saleForm').reset();
    ventaIdModificar.value = ''; 
    modalTitle.textContent = 'Caja Registradora';
    
    carritoActual = [];
    actualizarVistaCarrito();
    
    clientSearch.disabled = false; 
    clientSearch.value = "[1] Consumidor Final"; // ID genérico por defecto
    isContadoCheck.checked = true;
    
    formError.style.display = 'none';
    modal.classList.add('active');
    setTimeout(() => productSearch.focus(), 100);
});

window.prepararModificacion = async (idVenta) => {
    try {
        const res = await fetch(`${API_SALES}/${idVenta}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const ventaAnterior = await res.json();
        
        ventaIdModificar.value = ventaAnterior.id;
        modalTitle.textContent = `Modificando Factura #${ventaAnterior.id}`;
        
        // Bloquear cliente
        clientSearch.value = `[${ventaAnterior.clientId}] ${ventaAnterior.client?.name || 'Cliente Original'}`;
        clientSearch.disabled = true; 
        isContadoCheck.checked = ventaAnterior.isContado;

        carritoActual = ventaAnterior.detalleVenta.map(d => ({
            productId: d.productId,
            nameProduct: `ID Producto: ${d.productId} (Original)`,
            cantidadVendida: d.cantidadVendida,
            precioVendido: d.precioVendido
        }));

        actualizarVistaCarrito();
        formError.style.display = 'none';
        modal.classList.add('active');
    } catch (error) { 
        alert("Error obteniendo los datos de la venta original."); 
    }
};

btnSaveSale.addEventListener('click', async () => {
    const textoCliente = clientSearch.value.trim();
    let clientId = null;

    // Extraer ID usando Regex
    const match = textoCliente.match(/^\[(\d+)\]/);
    if (match) {
        clientId = parseInt(match[1]);
    }

    if (!clientId) return formError.style.display = 'block', formError.textContent = "Error: Cliente no válido. Usa el buscador sugerido.";
    if (carritoActual.length === 0) return formError.style.display = 'block', formError.textContent = "Error: El carrito está vacío.";

    // Empaque de datos para Prisma
    const payload = {
        clientId: clientId,
        isContado: isContadoCheck.checked,
        items: carritoActual.map(i => ({ 
            productId: i.productId, 
            cantidadVendida: i.cantidadVendida 
        }))
    };

    const idVentaExistente = ventaIdModificar.value; 
    const urlFinal = idVentaExistente ? `${API_SALES}/${idVentaExistente}` : API_SALES;
    const metodoHTTP = idVentaExistente ? 'PATCH' : 'POST';

    try {
        btnSaveSale.disabled = true; 
        btnSaveSale.textContent = idVentaExistente ? 'Modificando...' : 'Procesando...';

        const respuesta = await fetch(urlFinal, {
            method: metodoHTTP,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.message || "Error desconocido en el servidor.");

        cerrarModal();
        cargarVentas(); 
        
        if (idVentaExistente) {
            alert(`✅ La Factura #${idVentaExistente} fue ANULADA y se generó una nueva correctamente.`);
        } else {
            alert("✅ ¡Pago Procesado con Éxito!");
        }

    } catch (error) {
        formError.textContent = error.message; 
        formError.style.display = 'block';
    } finally {
        btnSaveSale.disabled = false; 
        btnSaveSale.textContent = '💰 Procesar Pago';
    }
});

const cerrarModal = () => modal.classList.remove('active');
document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
document.getElementById('btnCancelSale').addEventListener('click', cerrarModal);