// invoiceActions.js

// Variable global para identificar la factura en edición
let facturaEnEdicion = null;

// Evento para abrir el modal de agregar factura
document.getElementById('agregar-factura-btn').addEventListener('click', function() {
    document.getElementById('modal-title').innerText = 'Agregar Nueva Factura';
    document.getElementById('factura-modal').style.display = 'flex';
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
    limpiarCamposFactura();
});

// Evento para cerrar el modal de factura
document.getElementById('close-factura-modal').addEventListener('click', function() {
    cerrarModalFactura();
});

// Función para cerrar el modal de factura
function cerrarModalFactura() {
    document.getElementById('factura-modal').style.display = 'none';
    limpiarCamposFactura();
    facturaEnEdicion = null;
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
}

// Evento para guardar la nueva factura
document.getElementById('guardar-factura').addEventListener('click', guardarFactura);

// Evento para el botón "Editar Factura"
document.getElementById('editar-factura-btn').addEventListener('click', function() {
    if (facturaSeleccionada !== null) {
        cargarDatosFactura(facturaSeleccionada);
    }
});

// Evento para el botón "Eliminar Factura"
document.getElementById('eliminar-factura-btn').addEventListener('click', function() {
    if (facturaSeleccionada !== null) {
        Swal.fire({
            title: '¿Está seguro?',
            text: 'Esta acción eliminará la factura seleccionada.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                eliminarFactura(facturaSeleccionada);
            }
        });
    }
});

// Función para guardar una nueva factura
async function guardarFactura() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);
    const comentario = document.getElementById('comentario-factura').value.trim();

    // Validaciones
    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
        !fechaVencimiento || isNaN(montoFactura)) {
        Swal.fire('Error', 'Complete todos los campos obligatorios.', 'error');
        return;
    }

    try {
        mostrarCarga();

        const transactionFacturas = db.transaction(["facturas"], "readwrite");
        const facturaStore = transactionFacturas.objectStore("facturas");

        const nuevaFactura = {
            sucursalId: parseInt(sucursalId),
            proveedorId: parseInt(proveedorId),
            numeroFactura,
            fechaEmision,
            fechaVencimiento,
            montoFactura: montoFactura,
            montoPendiente: montoFactura,
            estado: 'Pendiente',
            comentario, // Campo opcional
            boletas: []
        };

        await agregarFacturaAsync(facturaStore, nuevaFactura);

        Swal.fire('Éxito', 'Factura agregada correctamente', 'success');
        cerrarModalFactura();
        cargarFacturas();
    } catch (error) {
        console.error('Error al guardar la factura:', error);
        Swal.fire('Error', 'No se pudo guardar la factura.', 'error');
    } finally {
        ocultarCarga();
    }
}

// Función asíncrona para agregar una factura
function agregarFacturaAsync(store, factura) {
    return new Promise((resolve, reject) => {
        const request = store.add(factura);
        request.onsuccess = function() {
            resolve();
        };
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Función para cargar datos de la factura en el modal
async function cargarDatosFactura(facturaId) {
    try {
        mostrarCarga();

        const factura = await obtenerFacturaAsync(facturaId);

        if (factura.estado === 'Pagada') {
            Swal.fire('Error', 'No se puede editar una factura ya pagada.', 'error');
            return;
        }

        document.getElementById('modal-title').innerText = 'Editar Factura';
        document.getElementById('factura-modal').style.display = 'flex';
        document.getElementById('sucursal-factura').value = factura.sucursalId;
        document.getElementById('proveedor-factura').value = factura.proveedorId;
        document.getElementById('numero-factura').value = factura.numeroFactura;
        document.getElementById('fecha-emision').value = factura.fechaEmision;
        document.getElementById('fecha-vencimiento').value = factura.fechaVencimiento;
        document.getElementById('monto-factura').value = factura.montoFactura;
        document.getElementById('comentario-factura').value = factura.comentario || '';

        document.getElementById('guardar-factura').style.display = 'none';
        document.getElementById('actualizar-factura').style.display = 'inline-block';

        facturaEnEdicion = facturaId;
    } catch (error) {
        console.error('Error al cargar los datos de la factura:', error);
        Swal.fire('Error', 'No se pudo cargar la factura.', 'error');
    } finally {
        ocultarCarga();
    }
}

// Función asíncrona para obtener una factura
function obtenerFacturaAsync(facturaId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['facturas'], 'readonly');
        const facturaStore = transaction.objectStore('facturas');
        const request = facturaStore.get(facturaId);

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Evento para actualizar la factura
document.getElementById('actualizar-factura').addEventListener('click', actualizarFactura);

// Función para actualizar una factura existente
async function actualizarFactura() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);
    const comentario = document.getElementById('comentario-factura').value.trim();

    // Validaciones
    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
        !fechaVencimiento || isNaN(montoFactura)) {
        Swal.fire('Error', 'Complete todos los campos obligatorios.', 'error');
        return;
    }

    try {
        mostrarCarga();

        const factura = await obtenerFacturaAsync(facturaEnEdicion);

        // Ajustar monto pendiente si el monto de la factura cambió
        const diferenciaMonto = montoFactura - factura.montoFactura;
        factura.sucursalId = parseInt(sucursalId);
        factura.proveedorId = parseInt(proveedorId);
        factura.numeroFactura = numeroFactura;
        factura.fechaEmision = fechaEmision;
        factura.fechaVencimiento = fechaVencimiento;
        factura.montoFactura = montoFactura;
        factura.montoPendiente += diferenciaMonto;
        factura.comentario = comentario;

        const transaction = db.transaction(['facturas'], 'readwrite');
        const facturaStore = transaction.objectStore('facturas');

        await actualizarFacturaAsync(facturaStore, factura);

        Swal.fire('Éxito', 'Factura actualizada correctamente', 'success');
        cerrarModalFactura();
        cargarFacturas();
    } catch (error) {
        console.error('Error al actualizar la factura:', error);
        Swal.fire('Error', 'No se pudo actualizar la factura.', 'error');
    } finally {
        ocultarCarga();
    }
}

// Función asíncrona para actualizar una factura
function actualizarFacturaAsync(store, factura) {
    return new Promise((resolve, reject) => {
        const request = store.put(factura);
        request.onsuccess = function() {
            resolve();
        };
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Función para eliminar la factura
async function eliminarFactura(facturaId) {
    try {
        mostrarCarga();

        const transaction = db.transaction(['facturas'], 'readwrite');
        const facturaStore = transaction.objectStore('facturas');

        await eliminarFacturaAsync(facturaStore, facturaId);

        Swal.fire('Eliminada', 'La factura ha sido eliminada.', 'success');
        cargarFacturas();
        facturaSeleccionada = null;
        document.getElementById('editar-factura-btn').disabled = true;
        document.getElementById('eliminar-factura-btn').disabled = true;
    } catch (error) {
        console.error('Error al eliminar la factura:', error);
        Swal.fire('Error', 'No se pudo eliminar la factura.', 'error');
    } finally {
        ocultarCarga();
    }
}

// Función asíncrona para eliminar una factura
function eliminarFacturaAsync(store, facturaId) {
    return new Promise((resolve, reject) => {
        const request = store.delete(facturaId);
        request.onsuccess = function() {
            resolve();
        };
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Función para limpiar los campos del modal
function limpiarCamposFactura() {
    document.getElementById('sucursal-factura').value = '';
    document.getElementById('proveedor-factura').value = '';
    document.getElementById('numero-factura').value = '';
    document.getElementById('fecha-emision').value = '';
    document.getElementById('fecha-vencimiento').value = '';
    document.getElementById('monto-factura').value = '';
    document.getElementById('dias-credito-factura').value = '';
    document.getElementById('comentario-factura').value = '';
}

// Evento para cargar los días de crédito al seleccionar un proveedor
document.getElementById('proveedor-factura').addEventListener('change', async function() {
    const proveedorId = parseInt(this.value);
    if (!proveedorId) {
        document.getElementById('dias-credito-factura').value = '';
        document.getElementById('fecha-vencimiento').value = '';
        return;
    }

    try {
        mostrarCarga();
        const proveedor = await obtenerProveedorAsync(proveedorId);
        if (proveedor) {
            document.getElementById('dias-credito-factura').value = proveedor.diasCredito;
            calcularFechaVencimiento();
        } else {
            document.getElementById('dias-credito-factura').value = '';
            document.getElementById('fecha-vencimiento').value = '';
        }
    } catch (error) {
        console.error('Error al obtener el proveedor:', error);
        Swal.fire('Error', 'No se pudo obtener los datos del proveedor.', 'error');
    } finally {
        ocultarCarga();
    }
});

// Función asíncrona para obtener un proveedor
function obtenerProveedorAsync(proveedorId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["proveedores"], "readonly");
        const proveedorStore = transaction.objectStore("proveedores");
        const request = proveedorStore.get(proveedorId);

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Evento para calcular la fecha de vencimiento al ingresar la fecha de emisión
document.getElementById('fecha-emision').addEventListener('change', calcularFechaVencimiento);

// Función para calcular la fecha de vencimiento
function calcularFechaVencimiento() {
    const fechaEmision = document.getElementById('fecha-emision').value;
    const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);

    if (fechaEmision && diasCredito && !isNaN(diasCredito)) {
        const fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
        const fechaVencimientoString = fechaVencimiento.toISOString().split('T')[0];
        document.getElementById('fecha-vencimiento').value = fechaVencimientoString;
    } else {
        document.getElementById('fecha-vencimiento').value = '';
    }
}

// Funciones para manejar indicadores de carga
function mostrarCarga() {
    // Puedes personalizar este indicador según tus necesidades
    Swal.fire({
        title: 'Procesando...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function ocultarCarga() {
    Swal.close();
}
