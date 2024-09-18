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
    document.getElementById('factura-modal').style.display = 'none';
    limpiarCamposFactura();
    facturaEnEdicion = null;
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
});

// Evento para guardar la nueva factura
document.getElementById('guardar-factura').addEventListener('click', function() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);

    console.log("Agregar factura:", { sucursalId, proveedorId, numeroFactura, fechaEmision, fechaVencimiento, montoFactura });

    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
        !fechaVencimiento || isNaN(montoFactura)) {
        Swal.fire('Error', 'Complete todos los campos.', 'error');
        return;
    }

    // Guardar la factura en IndexedDB
    const transactionFacturas = db.transaction(["facturas"], "readwrite");
    const facturaStore = transactionFacturas.objectStore("facturas");

    const facturaData = {
        sucursalId: parseInt(sucursalId),
        proveedorId: parseInt(proveedorId),
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        montoFactura: montoFactura,
        montoPendiente: montoFactura,
        estado: 'Pendiente',
        boletas: []
    };

    console.log("Factura a agregar:", facturaData);

    facturaStore.add(facturaData);

    transactionFacturas.oncomplete = function() {
        console.log("Factura agregada correctamente");
        Swal.fire('Éxito', 'Factura agregada correctamente', 'success');
        document.getElementById('factura-modal').style.display = 'none';
        limpiarCamposFactura();
        cargarFacturas(); // Asegúrate de que esta función está definida y refresca la tabla
    };

    transactionFacturas.onerror = function(event) {
        console.error('Error al guardar la factura:', event.target.error);
        Swal.fire('Error', 'No se pudo guardar la factura.', 'error');
    };
});

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

// Función para cargar datos de la factura en el modal
function cargarDatosFactura(facturaId) {
    const transaction = db.transaction(['facturas'], 'readonly');
    const facturaStore = transaction.objectStore('facturas');

    const getRequest = facturaStore.get(facturaId);

    getRequest.onsuccess = function(event) {
        const factura = event.target.result;

        document.getElementById('modal-title').innerText = 'Editar Factura';
        document.getElementById('factura-modal').style.display = 'flex';
        document.getElementById('sucursal-factura').value = factura.sucursalId;
        document.getElementById('proveedor-factura').value = factura.proveedorId;
        document.getElementById('numero-factura').value = factura.numeroFactura;
        document.getElementById('fecha-emision').value = factura.fechaEmision;
        document.getElementById('fecha-vencimiento').value = factura.fechaVencimiento;
        document.getElementById('monto-factura').value = factura.montoFactura;

        document.getElementById('guardar-factura').style.display = 'none';
        document.getElementById('actualizar-factura').style.display = 'inline-block';

        facturaEnEdicion = facturaId;
    };
}

// Evento para actualizar la factura
document.getElementById('actualizar-factura').addEventListener('click', function() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);

    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
        !fechaVencimiento || isNaN(montoFactura)) {
        Swal.fire('Error', 'Complete todos los campos.', 'error');
        return;
    }

    const transaction = db.transaction(['facturas'], 'readwrite');
    const facturaStore = transaction.objectStore('facturas');

    const getRequest = facturaStore.get(facturaEnEdicion);

    getRequest.onsuccess = function(event) {
        const factura = event.target.result;

        factura.sucursalId = parseInt(sucursalId);
        factura.proveedorId = parseInt(proveedorId);
        factura.numeroFactura = numeroFactura;
        factura.fechaEmision = fechaEmision;
        factura.fechaVencimiento = fechaVencimiento;

        // Ajustar monto pendiente si el monto de la factura cambió
        const diferenciaMonto = montoFactura - factura.montoFactura;
        factura.montoFactura = montoFactura;
        factura.montoPendiente += diferenciaMonto;

        const updateRequest = facturaStore.put(factura);

        updateRequest.onsuccess = function() {
            Swal.fire('Éxito', 'Factura actualizada correctamente', 'success');
            document.getElementById('factura-modal').style.display = 'none';
            limpiarCamposFactura();
            cargarFacturas();
            facturaSeleccionada = null;
            facturaEnEdicion = null;
            document.getElementById('editar-factura-btn').disabled = true;
            document.getElementById('eliminar-factura-btn').disabled = true;
            document.getElementById('guardar-factura').style.display = 'inline-block';
            document.getElementById('actualizar-factura').style.display = 'none';
        };

        updateRequest.onerror = function(event) {
            console.error('Error al actualizar la factura:', event.target.error);
            Swal.fire('Error', 'No se pudo actualizar la factura.', 'error');
        };
    };
});

// Función para eliminar la factura
function eliminarFactura(facturaId) {
    const transaction = db.transaction(['facturas'], 'readwrite');
    const facturaStore = transaction.objectStore('facturas');

    const deleteRequest = facturaStore.delete(facturaId);

    deleteRequest.onsuccess = function() {
        Swal.fire('Eliminada', 'La factura ha sido eliminada.', 'success');
        cargarFacturas();
        facturaSeleccionada = null;
        document.getElementById('editar-factura-btn').disabled = true;
        document.getElementById('eliminar-factura-btn').disabled = true;
    };

    deleteRequest.onerror = function(event) {
        console.error('Error al eliminar la factura:', event.target.error);
        Swal.fire('Error', 'No se pudo eliminar la factura.', 'error');
    };
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
}

// Evento para cargar los días de crédito al seleccionar un proveedor
document.getElementById('proveedor-factura').addEventListener('change', function() {
    const proveedorId = parseInt(this.value);
    if (!proveedorId) {
        document.getElementById('dias-credito-factura').value = '';
        return;
    }

    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    const request = proveedorStore.get(proveedorId);
    request.onsuccess = function(event) {
        const proveedor = event.target.result;
        if (proveedor) {
            document.getElementById('dias-credito-factura').value = proveedor.diasCredito;
            calcularFechaVencimiento();
        }
    };
});

// Evento para calcular la fecha de vencimiento al ingresar la fecha de emisión
document.getElementById('fecha-emision').addEventListener('change', calcularFechaVencimiento);

// Función para calcular la fecha de vencimiento
function calcularFechaVencimiento() {
    const fechaEmision = document.getElementById('fecha-emision').value;
    const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);

    if (fechaEmision && diasCredito) {
        const fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
        const fechaVencimientoString = fechaVencimiento.toISOString().split('T')[0];
        document.getElementById('fecha-vencimiento').value = fechaVencimientoString;
    } else {
        document.getElementById('fecha-vencimiento').value = '';
    }
}
