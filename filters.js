// filters.js

// Variables para filtros y búsqueda
let filtroEstado = 'todas';

// Añadir eventos para los filtros
document.getElementById('filtro-sucursal').addEventListener('change', cargarFacturas);
document.getElementById('filtro-empresa').addEventListener('change', cargarFacturas);
document.getElementById('filtro-proveedor').addEventListener('change', cargarFacturas);
document.getElementById('filtro-banco').addEventListener('change', cargarFacturas);
document.getElementById('ordenar-por').addEventListener('change', cargarFacturas);
document.getElementById('buscar-factura').addEventListener('input', cargarFacturas);
document.getElementById('buscar-boleta').addEventListener('input', cargarFacturas);

document.querySelectorAll('.btn-estado').forEach(button => {
    button.addEventListener('click', function() {
        filtroEstado = this.dataset.estado;
        cargarFacturas();
    });
});

// Función para cargar y renderizar facturas desde IndexedDB
function cargarFacturas() {
    const tableBody = document.getElementById('facturas-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    const filtroSucursal = document.getElementById('filtro-sucursal').value;
    const filtroEmpresa = document.getElementById('filtro-empresa').value;
    const filtroProveedor = document.getElementById('filtro-proveedor').value;
    const filtroBanco = document.getElementById('filtro-banco').value;
    const criterioOrdenamiento = document.getElementById('ordenar-por').value;
    const buscarFactura = document.getElementById('buscar-factura').value.trim().toLowerCase();
    const buscarBoleta = document.getElementById('buscar-boleta').value.trim().toLowerCase();

    const buscarFacturas = buscarFactura.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
    const buscarBoletas = buscarBoleta.split(',').map(term => term.trim().toLowerCase()).filter(term => term);

    const facturasFiltradas = [];

    const transaction = db.transaction(["facturas", "sucursales", "proveedores", "empresas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");
    const sucursalStore = transaction.objectStore("sucursales");
    const proveedorStore = transaction.objectStore("proveedores");
    const empresaStore = transaction.objectStore("empresas");

    facturaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const factura = cursor.value;

            const sucursalRequest = sucursalStore.get(factura.sucursalId);

            sucursalRequest.onsuccess = function() {
                const sucursal = sucursalRequest.result;
                const proveedorRequest = proveedorStore.get(factura.proveedorId);
                const empresaRequest = empresaStore.get(sucursal.empresaId);

                proveedorRequest.onsuccess = function() {
                    empresaRequest.onsuccess = function() {
                        factura.sucursalNombre = sucursal.nombre;
                        factura.proveedorNombre = proveedorRequest.result.nombre;
                        factura.empresaNombre = empresaRequest.result.nombre;
                        factura.banco = factura.boletas.length > 0 ? factura.boletas[factura.boletas.length - 1].banco : '';

                        // Aplicar filtros
                        if ((filtroSucursal === 'todas' || factura.sucursalId == filtroSucursal) &&
                            (filtroEmpresa === 'todas' || sucursal.empresaId == filtroEmpresa) &&
                            (filtroProveedor === 'todos' || factura.proveedorId == filtroProveedor) &&
                            (filtroBanco === 'todos' || factura.banco === filtroBanco)) {

                            // Filtrar por estado
                            if (filtrarPorEstado(factura)) {

                                // Búsqueda múltiple por número de factura
                                if (buscarFacturas.length > 0) {
                                    const coincideFactura = buscarFacturas.some(term => factura.numeroFactura.toLowerCase().includes(term));
                                    if (!coincideFactura) {
                                        cursor.continue();
                                        return;
                                    }
                                }

                                // Búsqueda múltiple por boleta ID
                                if (buscarBoletas.length > 0) {
                                    const boletaEncontrada = factura.boletas.some(boleta =>
                                        buscarBoletas.some(term => boleta.boletaId.toLowerCase().includes(term))
                                    );
                                    if (!boletaEncontrada) {
                                        cursor.continue();
                                        return;
                                    }
                                }

                                facturasFiltradas.push(factura);
                            }
                        }
                    };
                };
            };

            cursor.continue();
        } else {
            // Ordenar las facturas
            ordenarFacturas(facturasFiltradas, criterioOrdenamiento);

            // Renderizar las facturas
            facturasFiltradas.forEach(factura => renderFactura(factura));

            // Mostrar mensaje si no hay facturas
            if (facturasFiltradas.length === 0) {
                const fila = document.createElement('tr');
                fila.innerHTML = `<td colspan="14" style="text-align: center;">No se encontraron facturas que coincidan con los criterios seleccionados.</td>`;
                tableBody.appendChild(fila);
            }
        }
    };
}

// Función para filtrar por estado
function filtrarPorEstado(factura) {
    const hoy = new Date();
    const fechaVencimiento = new Date(factura.fechaVencimiento);
    const diferenciaDias = (fechaVencimiento - hoy) / (1000 * 60 * 60 * 24);

    switch (filtroEstado) {
        case 'todas':
            return true;
        case 'pagadas':
            return factura.estado === 'Pagada';
        case 'porPagar':
            return factura.estado !== 'Pagada';
        case 'vencidas':
            return factura.estado !== 'Pagada' && fechaVencimiento < hoy;
        case 'pagoPendiente':
            return factura.estado === 'Pendiente' && factura.montoPendiente < factura.montoFactura;
        case 'prontoVencer':
            return factura.estado !== 'Pagada' && diferenciaDias >= 0 && diferenciaDias <= 8;
        case 'porPagarHoy':
            return factura.estado !== 'Pagada' && fechaVencimiento.toDateString() === hoy.toDateString();
        default:
            return true;
    }
}

// Función para ordenar facturas
function ordenarFacturas(facturas, criterio) {
    facturas.sort((a, b) => {
        const fechaA = new Date(a.fechaEmision);
        const fechaB = new Date(b.fechaEmision);
        const vencimientoA = new Date(a.fechaVencimiento);
        const vencimientoB = new Date(b.fechaVencimiento);

        switch (criterio) {
            case 'masReciente':
                return fechaB - fechaA;
            case 'masAntiguo':
                return fechaA - fechaB;
            case 'vencimientoReciente':
                return vencimientoB - vencimientoA;
            case 'vencimientoAntiguo':
                return vencimientoA - vencimientoB;
            default:
                return 0;
        }
    });
}
