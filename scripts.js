// scripts.js

// Crear/abrir la base de datos de IndexedDB
let db;
const request = indexedDB.open("GestionDB", 2); // Versión 2 para posibles actualizaciones futuras

request.onupgradeneeded = function(event) {
    db = event.target.result;

    // Crear almacenes de objetos si no existen
    if (!db.objectStoreNames.contains('empresas')) {
        db.createObjectStore("empresas", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('sucursales')) {
        const sucursalStore = db.createObjectStore("sucursales", {
            keyPath: "id",
            autoIncrement: true
        });
        sucursalStore.createIndex("empresaId", "empresaId", { unique: false });
    }
    if (!db.objectStoreNames.contains('proveedores')) {
        db.createObjectStore("proveedores", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('facturas')) {
        const facturaStore = db.createObjectStore("facturas", {
            keyPath: "id",
            autoIncrement: true
        });
        facturaStore.createIndex("sucursalId", "sucursalId", { unique: false });
        facturaStore.createIndex("proveedorId", "proveedorId", { unique: false });
        facturaStore.createIndex("numeroFactura", "numeroFactura", { unique: false });
        facturaStore.createIndex("boletaId", "boletas.boletaId", { unique: false, multiEntry: true });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    cargarSucursales();
    cargarProveedores();
    cargarEmpresas();
    cargarSucursalesPago();
    cargarSucursalesFiltro();
    cargarEmpresasFiltro();
    cargarProveedoresFiltro();
    cargarFacturas();
};

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event);
};

// Variables globales
let facturasSeleccionadas = [];
let facturaSeleccionada = null;

// Función para cargar empresas en los selects (si es necesario)
function cargarEmpresas() {
    const empresaSelect = document.getElementById('filtro-empresa');
    // Asumiendo que tienes un select para empresas en el modal de agregar/editar factura
    // Si no es necesario, puedes eliminar esta función
    // Puedes implementar la carga de empresas si es parte de tu aplicación
}

// Función para cargar sucursales en los selects de agregar/editar factura
function cargarSucursales() {
    const sucursalSelect = document.getElementById('sucursal-factura');
    sucursalSelect.innerHTML = '<option value="">Seleccione una sucursal</option>';

    const transaction = db.transaction(["sucursales"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            sucursalSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para cargar sucursales en el select de pago
function cargarSucursalesPago() {
    const sucursalPagoSelect = document.getElementById('sucursal-pago');
    sucursalPagoSelect.innerHTML = '<option value="">Seleccione una sucursal</option>';

    const transaction = db.transaction(["sucursales"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.nombre;
            option.textContent = cursor.value.nombre;
            sucursalPagoSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para cargar sucursales en el filtro
function cargarSucursalesFiltro() {
    const sucursalSelect = document.getElementById('filtro-sucursal');
    sucursalSelect.innerHTML = '<option value="todas">Todas</option>';

    const transaction = db.transaction(["sucursales"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            sucursalSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para cargar empresas en el filtro
function cargarEmpresasFiltro() {
    const empresaSelect = document.getElementById('filtro-empresa');
    empresaSelect.innerHTML = '<option value="todas">Todas</option>';

    const transaction = db.transaction(["empresas"], "readonly");
    const empresaStore = transaction.objectStore("empresas");

    empresaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            empresaSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para cargar proveedores en los selects
function cargarProveedores() {
    const proveedorSelect = document.getElementById('proveedor-factura');
    proveedorSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';

    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    proveedorStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            proveedorSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para cargar proveedores en el filtro
function cargarProveedoresFiltro() {
    const proveedorSelect = document.getElementById('filtro-proveedor');
    proveedorSelect.innerHTML = '<option value="todos">Todos</option>';

    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    proveedorStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            proveedorSelect.appendChild(option);
            cursor.continue();
        }
    };
}

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
                    const proveedor = proveedorRequest.result;
                    empresaRequest.onsuccess = function() {
                        const empresa = empresaRequest.result;

                        factura.sucursalNombre = sucursal.nombre;
                        factura.proveedorNombre = proveedor.nombre;
                        factura.empresaNombre = empresa.nombre;
                        factura.banco = factura.boletas.length > 0 ? factura.boletas[factura.boletas.length - 1].banco : '';

                        // Aplicar filtros
                        if ((filtroSucursal === 'todas' || factura.sucursalId == filtroSucursal) &&
                            (filtroEmpresa === 'todas' || sucursal.empresaId == filtroEmpresa) &&
                            (filtroProveedor === 'todos' || factura.proveedorId == filtroProveedor) &&
                            (filtroBanco === 'todos' || factura.banco === filtroBanco)) {

                            // Aplicar búsqueda múltiple por número de factura
                            if (buscarFacturas.length > 0) {
                                const coincideFactura = buscarFacturas.some(term => factura.numeroFactura.toLowerCase().includes(term));
                                if (!coincideFactura) {
                                    cursor.continue();
                                    return;
                                }
                            }

                            // Aplicar búsqueda múltiple por boleta ID
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

// Función para renderizar una factura en la tabla
function renderFactura(factura) {
    const tableBody = document.getElementById('facturas-table');
    const row = document.createElement('tr');

    // Asignar clase según estado
    if (factura.boletas.length === 0) {
        row.classList.add('sin-pago');  // Rojo claro
    } else if (factura.montoPendiente > 0) {
        row.classList.add('pendiente'); // Amarillo claro
    } else {
        row.classList.add('pagada');    // Verde claro
    }

    // Obtener los últimos datos de boleta si existen
    const ultimaBoleta = factura.boletas.length > 0 ?
        factura.boletas[factura.boletas.length - 1] : null;

    // Determinar si la factura es editable/eliminable
    const esEditable = factura.estado !== 'Pagada' && factura.boletas.length === 0;

    row.innerHTML = `
        <td>
            <input type="checkbox" class="factura-checkbox" data-id="${factura.id}" data-monto="${factura.montoPendiente}" 
                ${!esEditable ? 'disabled title="No se puede editar o eliminar una factura pagada o con pagos aplicados."' : ''}>
        </td>
        <td>${factura.empresaNombre}</td>
        <td>${factura.sucursalNombre}</td>
        <td>${factura.proveedorNombre}</td>
        <td>${factura.numeroFactura}</td>
        <td>Q${factura.montoFactura.toFixed(2)}</td>
        <td>${factura.fechaVencimiento}</td>
        <td id="estado-${factura.id}" class="estado">
            ${factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente'}
        </td>
        <td id="montoPendiente-${factura.id}">Q${factura.montoPendiente.toFixed(2)}</td>
        <td id="boleta-${factura.id}">${ultimaBoleta ? ultimaBoleta.boletaId : 'N/A'}</td>
        <td id="fechaPago-${factura.id}">${ultimaBoleta ? ultimaBoleta.fecha : 'N/A'}</td>
        <td id="montoPagado-${factura.id}">
            ${ultimaBoleta ? `Q${ultimaBoleta.montoAplicado.toFixed(2)}` : 'N/A'}
        </td>
        <td id="banco-${factura.id}">${ultimaBoleta ? ultimaBoleta.banco : 'N/A'}</td>
        <td>
            <button class="btn" onclick="verPago(${factura.id})"
                ${factura.boletas.length > 0 ? '' : 'disabled'}>
                Ver Pago Realizado
            </button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Evento para manejar la selección y deselección de facturas con checkboxes
document.addEventListener('change', function(event) {
    if (event.target.classList.contains('factura-checkbox')) {
        const facturaId = parseInt(event.target.dataset.id);
        const montoPendiente = parseFloat(event.target.dataset.monto);

        if (event.target.checked) {
            facturasSeleccionadas.push({ id: facturaId, montoPendiente });
        } else {
            facturasSeleccionadas = facturasSeleccionadas.filter(factura => factura.id !== facturaId);
        }

        // Actualizar facturaSeleccionada
        if (facturasSeleccionadas.length === 1) {
            facturaSeleccionada = facturasSeleccionadas[0].id;
        } else {
            facturaSeleccionada = null;
        }

        // Actualizar el total pendiente seleccionado
        actualizarTotalPendiente();

        // Actualizar el estado de los botones de acción
        actualizarBotonesAccion();
    }
});

// Función para actualizar el estado de los botones de acción
function actualizarBotonesAccion() {
    const editarBtn = document.getElementById('editar-factura-btn');
    const eliminarBtn = document.getElementById('eliminar-factura-btn');
    const pagarBtn = document.getElementById('pagar-facturas-btn');

    if (facturasSeleccionadas.length === 1) {
        // Obtener la factura seleccionada para verificar si es editable
        const facturaId = facturasSeleccionadas[0].id;
        const transaction = db.transaction(['facturas'], 'readonly');
        const facturaStore = transaction.objectStore('facturas');
        const getRequest = facturaStore.get(facturaId);

        getRequest.onsuccess = function(event) {
            const factura = event.target.result;
            const esEditable = factura.estado !== 'Pagada' && factura.boletas.length === 0;
            editarBtn.disabled = !esEditable;
            eliminarBtn.disabled = !esEditable;
        };

        getRequest.onerror = function(event) {
            console.error('Error al obtener la factura:', event.target.error);
            editarBtn.disabled = true;
            eliminarBtn.disabled = true;
        };
    } else {
        editarBtn.disabled = true;
        eliminarBtn.disabled = true;
    }

    if (facturasSeleccionadas.length > 0) {
        pagarBtn.disabled = false;
    } else {
        pagarBtn.disabled = true;
    }
}

// Función para actualizar el total pendiente seleccionado
function actualizarTotalPendiente() {
    let totalPendiente = facturasSeleccionadas.reduce((total, factura) =>
        total + parseFloat(factura.montoPendiente), 0);

    // Actualizar el total pendiente en la tabla principal
    document.getElementById('total-pendiente').innerText = `Q${totalPendiente.toFixed(2)}`;

    // También actualizar el total pendiente en el modal de pago si está abierto
    if (document.getElementById('pago-modal').style.display === 'flex') {
        document.getElementById('monto-total-modal').innerText = `Total Pendiente: Q${totalPendiente.toFixed(2)}`;
    }
}

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

// Variable global para identificar la factura en edición
let facturaEnEdicion = null;

// Evento para guardar la nueva factura
document.getElementById('guardar-factura').addEventListener('click', function() {
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

    // Guardar la factura en IndexedDB
    const transactionFacturas = db.transaction(["facturas"], "readwrite");
    const facturaStore = transactionFacturas.objectStore("facturas");

    facturaStore.add({
        sucursalId: parseInt(sucursalId),
        proveedorId: parseInt(proveedorId),
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        montoFactura: montoFactura,
        montoPendiente: montoFactura,
        estado: 'Pendiente',
        boletas: []
    });

    transactionFacturas.oncomplete = function() {
        Swal.fire('Éxito', 'Factura agregada correctamente', 'success');
        document.getElementById('factura-modal').style.display = 'none';
        limpiarCamposFactura();
        cargarFacturas();
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
    document.getElementById('dias-credito-factura').value = '';
    document.getElementById('numero-factura').value = '';
    document.getElementById('fecha-emision').value = '';
    document.getElementById('fecha-vencimiento').value = '';
    document.getElementById('monto-factura').value = '';
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

// Evento para abrir el modal de pago al hacer clic en "Pagar Facturas"
document.getElementById('pagar-facturas-btn').addEventListener('click', function () {
    if (facturasSeleccionadas.length === 0) {
        Swal.fire('Error', 'Por favor seleccione al menos una factura para pagar.', 'error');
        return;
    }

    if (facturasSeleccionadas.length >= 2) {
        // Obtener todas las empresas de las facturas seleccionadas
        const transaction = db.transaction(["facturas", "sucursales", "empresas"], "readonly");
        const facturaStore = transaction.objectStore("facturas");
        const sucursalStore = transaction.objectStore("sucursales");
        const empresaStore = transaction.objectStore("empresas");

        let empresas = new Set();
        let facturasCompletadas = 0;

        facturasSeleccionadas.forEach(facturaSeleccionada => {
            const facturaRequest = facturaStore.get(facturaSeleccionada.id);

            facturaRequest.onsuccess = function(event) {
                const factura = event.target.result;
                const sucursalRequest = sucursalStore.get(factura.sucursalId);

                sucursalRequest.onsuccess = function() {
                    const sucursal = sucursalRequest.result;
                    const empresaRequest = empresaStore.get(sucursal.empresaId);

                    empresaRequest.onsuccess = function() {
                        const empresa = empresaRequest.result;
                        empresas.add(empresa.id);
                        facturasCompletadas++;

                        // Una vez procesadas todas las facturas seleccionadas
                        if (facturasCompletadas === facturasSeleccionadas.length) {
                            if (empresas.size > 1) {
                                Swal.fire('Error', 'Solo se pueden pagar dos o más facturas si pertenecen a la misma empresa.', 'error');
                                return;
                            } else {
                                mostrarModalPago();
                            }
                        }
                    };
                };
            };

            facturaRequest.onerror = function(event) {
                console.error('Error al obtener la factura:', event.target.error);
                Swal.fire('Error', 'No se pudo verificar la empresa de las facturas seleccionadas.', 'error');
            };
        });
    } else {
        // Si solo se selecciona una factura, permitir pagar
        mostrarModalPago();
    }
});

// Función para mostrar el modal de pago con las facturas seleccionadas y el total pendiente
function mostrarModalPago() {
    const facturasSeleccionadasDiv = document.getElementById('facturas-seleccionadas');
    facturasSeleccionadasDiv.innerHTML = '';

    let totalPendiente = 0;
    let empresas = new Set();

    // Obtener detalles de todas las facturas seleccionadas
    const transaction = db.transaction(["facturas", "sucursales", "proveedores", "empresas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");
    const sucursalStore = transaction.objectStore("sucursales");
    const proveedorStore = transaction.objectStore("proveedores");
    const empresaStore = transaction.objectStore("empresas");

    let facturasProcesadas = 0;

    facturasSeleccionadas.forEach(facturaSeleccionada => {
        const facturaRequest = facturaStore.get(facturaSeleccionada.id);

        facturaRequest.onsuccess = function(event) {
            const factura = event.target.result;

            const sucursalRequest = sucursalStore.get(factura.sucursalId);
            sucursalRequest.onsuccess = function() {
                const sucursal = sucursalRequest.result;
                const proveedorRequest = proveedorStore.get(factura.proveedorId);
                const empresaRequest = empresaStore.get(sucursal.empresaId);

                proveedorRequest.onsuccess = function() {
                    const proveedor = proveedorRequest.result;

                    empresaRequest.onsuccess = function() {
                        const empresa = empresaRequest.result;

                        empresas.add(empresa.nombre); // Agregar el nombre de la empresa

                        const facturaInfo = document.createElement('p');
                        facturaInfo.textContent = `Factura ID: ${factura.id}, Empresa: ${empresa.nombre}, Sucursal: ${sucursal.nombre}, Proveedor: ${proveedor.nombre}, Monto Pendiente: Q${factura.montoPendiente.toFixed(2)}`;
                        facturasSeleccionadasDiv.appendChild(facturaInfo);

                        totalPendiente += factura.montoPendiente;
                        facturasProcesadas++;

                        // Una vez procesadas todas las facturas seleccionadas
                        if (facturasProcesadas === facturasSeleccionadas.length) {
                            // Mostrar el total pendiente en el modal
                            document.getElementById('monto-total-modal').innerText = `Total Pendiente: Q${totalPendiente.toFixed(2)}`;

                            // Mostrar el modal de pago
                            document.getElementById('pago-modal').style.display = 'flex';
                        }
                    };
                };
            };
        };
    });
}

// Función para aplicar pagos a las facturas seleccionadas
document.getElementById('aplicar-pago').addEventListener('click', function () {
    if (!validarPago()) return;

    const montoTotal = parseFloat(document.getElementById('monto-total').value);
    const fechaPago = document.getElementById('fecha-pago').value;
    const numeroBoleta = document.getElementById('numero-boleta').value.trim();
    const bancoSeleccionado = document.getElementById('banco').value;
    const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;

    if (!fechaPago || !numeroBoleta || bancoSeleccionado === "" ||
        sucursalPagoSeleccionada === "") {
        Swal.fire('Error', 'Complete todos los campos: fecha, número de boleta, banco y sucursal.', 'error');
        return;
    }

    let montoRestante = montoTotal;
    const transaction = db.transaction(["facturas"], "readwrite");
    const facturaStore = transaction.objectStore("facturas");

    facturaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const factura = cursor.value;

            if (facturasSeleccionadas.find(f => f.id === factura.id) && montoRestante > 0) {
                let pagoAplicado = 0;

                if (montoRestante >= factura.montoPendiente) {
                    pagoAplicado = factura.montoPendiente;
                    montoRestante -= factura.montoPendiente;
                    factura.montoPendiente = 0;
                    factura.estado = 'Pagada';
                } else {
                    pagoAplicado = montoRestante;
                    factura.montoPendiente -= montoRestante;
                    montoRestante = 0;
                    factura.estado = 'Pendiente';
                }

                // Agregar la boleta
                if (!factura.boletas) {
                    factura.boletas = [];
                }

                factura.boletas.push({
                    boletaId: numeroBoleta,
                    montoAplicado: parseFloat(pagoAplicado),
                    totalBoleta: montoTotal,
                    fecha: fechaPago,
                    banco: bancoSeleccionado,
                    sucursalDeposito: sucursalPagoSeleccionada
                });

                cursor.update(factura);
            }

            cursor.continue();
        } else {
            if (montoRestante > 0) {
                Swal.fire('Aviso', `Monto restante sin aplicar: Q${montoRestante.toFixed(2)}`, 'info');
            }

            Swal.fire({
                title: '¡Pago aplicado con éxito!',
                html: `
                    <strong>Fecha:</strong> ${fechaPago}<br>
                    <strong>Número de Boleta:</strong> ${numeroBoleta}<br>
                    <strong>Banco:</strong> ${bancoSeleccionado}<br>
                    <strong>Sucursal de Depósito:</strong> ${sucursalPagoSeleccionada}
                `,
                icon: 'success',
                confirmButtonText: 'Aceptar'
            });

            // Limpiar el formulario y restablecer la interfaz
            document.getElementById('monto-total').value = '';
            document.getElementById('fecha-pago').value = '';
            document.getElementById('numero-boleta').value = '';
            document.getElementById('banco').value = '';
            document.getElementById('sucursal-pago').value = '';
            document.getElementById('aplicar-pago').disabled = true;
            document.querySelectorAll('.factura-checkbox').forEach(checkbox => checkbox.checked = false);
            facturasSeleccionadas = [];
            facturaSeleccionada = null;
            actualizarTotalPendiente();
            actualizarBotonesAccion();
            cargarFacturas();
            document.getElementById('pago-modal').style.display = 'none';
        }
    };
});

// Función para validar el formulario de pago
function validarPago() {
    const montoTotal = parseFloat(document.getElementById('monto-total').value);
    const bancoSeleccionado = document.getElementById('banco').value;
    const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;

    if (isNaN(montoTotal) || montoTotal <= 0) {
        Swal.fire('Error', 'Por favor ingrese un monto válido.', 'error');
        return false;
    }

    if (bancoSeleccionado === "") {
        Swal.fire('Error', 'Por favor seleccione un banco.', 'error');
        return false;
    }

    if (sucursalPagoSeleccionada === "") {
        Swal.fire('Error', 'Por favor seleccione una sucursal para el pago.', 'error');
        return false;
    }

    return true;
}

// Función para ver los detalles del pago realizado
function verPago(facturaId) {
    const transaction = db.transaction(["facturas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");

    facturaStore.get(facturaId).onsuccess = function(event) {
        const factura = event.target.result;
        const modal = document.getElementById('modal');
        const detallesPago = document.getElementById('detalles-pago');

        if (factura.boletas && factura.boletas.length > 0) {
            const boletasDetalles = factura.boletas.map(boleta => `
                <strong>Boleta ID:</strong> ${boleta.boletaId}<br>
                <strong>Monto Pagado:</strong> Q${boleta.montoAplicado.toFixed(2)}<br>
                <strong>Total de Boleta:</strong> Q${boleta.totalBoleta.toFixed(2)}<br>
                <strong>Banco:</strong> ${boleta.banco}<br>
                <strong>Fecha de Pago:</strong> ${boleta.fecha}<br>
                <strong>Quién Depositó:</strong> ${boleta.sucursalDeposito}
            `).join('<hr>');

            detallesPago.innerHTML = boletasDetalles;
            modal.style.display = 'flex';
        }
    };
}

// Cerrar el modal cuando se haga clic en la "x"
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Cerrar el modal de pago cuando se haga clic en la "x"
document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
    document.getElementById('facturas-seleccionadas').innerHTML = '';
    document.getElementById('monto-total-modal').innerText = 'Total Pendiente: Q0.00';
});

// Función para generar el reporte con facturas y boletas asociadas
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = ''; // Limpiar el contenido antes de generar el reporte

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
                    const proveedor = proveedorRequest.result;
                    empresaRequest.onsuccess = function() {
                        const empresa = empresaRequest.result;

                        factura.sucursalNombre = sucursal.nombre;
                        factura.proveedorNombre = proveedor.nombre;
                        factura.empresaNombre = empresa.nombre;

                        // Generar las filas del reporte incluyendo la empresa
                        renderReporteFila(factura);
                    };
                };
            };

            cursor.continue();
        } else {
            // Mostrar el modal de reporte
            document.getElementById('reporte-modal').style.display = 'flex';
        }
    };
}

// Función para renderizar una fila del reporte
function renderReporteFila(factura) {
    const reporteContenido = document.getElementById('reporte-contenido');

    if (factura.boletas && factura.boletas.length > 0) {
        const rowCount = factura.boletas.length;

        // Fila para la factura y primera boleta
        const filaFactura = document.createElement('tr');

        filaFactura.innerHTML = `
            <td rowspan="${rowCount}">${factura.empresaNombre}</td>
            <td rowspan="${rowCount}">${factura.sucursalNombre}</td>
            <td rowspan="${rowCount}">${factura.proveedorNombre}</td>
            <td rowspan="${rowCount}">${factura.numeroFactura}</td>
            <td rowspan="${rowCount}">Q${factura.montoFactura.toFixed(2)}</td>
            <td rowspan="${rowCount}">${factura.fechaVencimiento}</td>
            <td rowspan="${rowCount}">${factura.estado}</td>
            <td rowspan="${rowCount}">Q${factura.montoPendiente.toFixed(2)}</td>
            <td>${factura.boletas[0].boletaId}</td>
            <td>${factura.boletas[0].fecha}</td>
            <td>Q${factura.boletas[0].montoAplicado.toFixed(2)}</td>
            <td rowspan="${rowCount}">Q${factura.boletas[0].totalBoleta.toFixed(2)}</td>
            <td>${factura.boletas[0].banco}</td>
            <td>${factura.boletas[0].sucursalDeposito}</td>
        `;
        reporteContenido.appendChild(filaFactura);

        // Filas para las siguientes boletas de la misma factura
        for (let i = 1; i < rowCount; i++) {
            const filaBoleta = document.createElement('tr');
            filaBoleta.innerHTML = `
                <td>${factura.boletas[i].boletaId}</td>
                <td>${factura.boletas[i].fecha}</td>
                <td>Q${factura.boletas[i].montoAplicado.toFixed(2)}</td>
                <td>${factura.boletas[i].banco}</td>
                <td>${factura.boletas[i].sucursalDeposito}</td>
            `;
            reporteContenido.appendChild(filaBoleta);
        }
    } else {
        // Si la factura no tiene boletas
        const filaFactura = document.createElement('tr');
        filaFactura.innerHTML = `
            <td>${factura.empresaNombre}</td>
            <td>${factura.sucursalNombre}</td>
            <td>${factura.proveedorNombre}</td>
            <td>${factura.numeroFactura}</td>
            <td>Q${factura.montoFactura.toFixed(2)}</td>
            <td>${factura.fechaVencimiento}</td>
            <td>${factura.estado}</td>
            <td>Q${factura.montoPendiente.toFixed(2)}</td>
            <td colspan="6">Sin boletas</td>
        `;
        reporteContenido.appendChild(filaFactura);
    }
}

// Listener para el botón "Generar Reporte"
document.getElementById('generar-reporte-btn').addEventListener('click', generarReporte);

// Función para cerrar el modal de reporte y limpiar contenido
document.getElementById('close-reporte-modal').addEventListener('click', function() {
    document.getElementById('reporte-modal').style.display = 'none';
    document.getElementById('reporte-contenido').innerHTML = '';
});

// Exportar el reporte a Excel utilizando SheetJS
document.getElementById('export-excel').addEventListener('click', function() {
    const reporteTable = document.getElementById('reporte-table');
    const workbook = XLSX.utils.table_to_book(reporteTable, {sheet: "Reporte"});
    XLSX.writeFile(workbook, 'Reporte_Facturas.xlsx');
    Swal.fire('Éxito', 'Reporte exportado a Excel correctamente.', 'success');
});

// Exportar el reporte a PDF utilizando jsPDF
document.getElementById('export-pdf').addEventListener('click', function() {
    const reporteTable = document.getElementById('reporte-table');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    doc.autoTable({ html: '#reporte-table', startY: 50 });
    doc.save('Reporte_Facturas.pdf');
    Swal.fire('Éxito', 'Reporte exportado a PDF correctamente.', 'success');
});

// Exportar el reporte a Imagen utilizando html2canvas
document.getElementById('export-image').addEventListener('click', function() {
    const reporteModalContent = document.getElementById('reporte-modal').querySelector('.modal-content');

    html2canvas(reporteModalContent).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'Reporte_Facturas.png';
        link.click();
        Swal.fire('Éxito', 'Reporte exportado a Imagen correctamente.', 'success');
    }).catch(err => {
        console.error('Error al exportar el reporte a imagen:', err);
        Swal.fire('Error', 'No se pudo exportar el reporte a Imagen.', 'error');
    });
});

// Listener para el botón "Exportar Tabla"
document.getElementById('exportar-tabla-btn').addEventListener('click', function() {
    // Mostrar opciones de exportación utilizando SweetAlert2
    Swal.fire({
        title: 'Exportar Tabla de Facturas',
        text: 'Seleccione el formato al que desea exportar la tabla:',
        icon: 'info',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'Excel',
        denyButtonText: 'PDF',
        cancelButtonText: 'Imagen'
    }).then((result) => {
        if (result.isConfirmed) {
            exportarTablaExcel();
        } else if (result.isDenied) {
            exportarTablaPDF();
        } else if (result.isDismissed) {
            exportarTablaImagen();
        }
    });
});

// Función para exportar la tabla principal a Excel
function exportarTablaExcel() {
    const facturaTable = document.querySelector('table');
    const workbook = XLSX.utils.table_to_book(facturaTable, {sheet: "Facturas"});
    XLSX.writeFile(workbook, 'Facturas.xlsx');
    Swal.fire('Éxito', 'Tabla exportada a Excel correctamente.', 'success');
}

// Función para exportar la tabla principal a PDF
function exportarTablaPDF() {
    const facturaTable = document.querySelector('table');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    doc.autoTable({ html: facturaTable, startY: 50 });
    doc.save('Facturas.pdf');
    Swal.fire('Éxito', 'Tabla exportada a PDF correctamente.', 'success');
}

// Función para exportar la tabla principal a Imagen
function exportarTablaImagen() {
    const facturaTable = document.querySelector('table');

    html2canvas(facturaTable).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'Facturas.png';
        link.click();
        Swal.fire('Éxito', 'Tabla exportada a Imagen correctamente.', 'success');
    }).catch(err => {
        console.error('Error al exportar la tabla a imagen:', err);
        Swal.fire('Error', 'No se pudo exportar la tabla a Imagen.', 'error');
    });
}

// Función para ver los detalles del pago realizado
function verPago(facturaId) {
    const transaction = db.transaction(["facturas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");

    facturaStore.get(facturaId).onsuccess = function(event) {
        const factura = event.target.result;
        const modal = document.getElementById('modal');
        const detallesPago = document.getElementById('detalles-pago');

        if (factura.boletas && factura.boletas.length > 0) {
            const boletasDetalles = factura.boletas.map(boleta => `
                <strong>Boleta ID:</strong> ${boleta.boletaId}<br>
                <strong>Monto Pagado:</strong> Q${boleta.montoAplicado.toFixed(2)}<br>
                <strong>Total de Boleta:</strong> Q${boleta.totalBoleta.toFixed(2)}<br>
                <strong>Banco:</strong> ${boleta.banco}<br>
                <strong>Fecha de Pago:</strong> ${boleta.fecha}<br>
                <strong>Quién Depositó:</strong> ${boleta.sucursalDeposito}
            `).join('<hr>');

            detallesPago.innerHTML = boletasDetalles;
            modal.style.display = 'flex';
        }
    };
}

// Función para exportar el reporte a Excel utilizando SheetJS
function exportToExcel() {
    const reporteTable = document.getElementById('reporte-table');
    const workbook = XLSX.utils.table_to_book(reporteTable, {sheet: "Reporte"});
    XLSX.writeFile(workbook, 'Reporte_Facturas.xlsx');
}

// Función para exportar el reporte a PDF utilizando jsPDF
function exportToPDF() {
    const reporteTable = document.getElementById('reporte-table');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    doc.autoTable({ html: '#reporte-table', startY: 50 });
    doc.save('Reporte_Facturas.pdf');
}

// Función para exportar el reporte a Imagen utilizando html2canvas
function exportToImage() {
    const reporteModalContent = document.getElementById('reporte-modal').querySelector('.modal-content');

    html2canvas(reporteModalContent).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'Reporte_Facturas.png';
        link.click();
    });
}

// Listener para exportar el reporte a Excel
document.getElementById('export-excel').addEventListener('click', exportToExcel);

// Listener para exportar el reporte a PDF
document.getElementById('export-pdf').addEventListener('click', exportToPDF);

// Listener para exportar el reporte a Imagen
document.getElementById('export-image').addEventListener('click', exportToImage);

// Función para limpiar la selección de facturas
function limpiarSeleccionFacturas() {
    document.querySelectorAll('.factura-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    facturasSeleccionadas = [];
    facturaSeleccionada = null;
    actualizarTotalPendiente();
    actualizarBotonesAccion();
}

// Listener para cerrar el modal de reporte y limpiar contenido
document.getElementById('close-reporte-modal').addEventListener('click', function() {
    document.getElementById('reporte-modal').style.display = 'none';
    document.getElementById('reporte-contenido').innerHTML = '';
});

// Listener para cerrar el modal de pago
document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
    document.getElementById('facturas-seleccionadas').innerHTML = '';
    document.getElementById('monto-total-modal').innerText = 'Total Pendiente: Q0.00';
});

// Listener para cerrar el modal de detalles de pago
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Listener para filtros
document.querySelectorAll('.filtros select').forEach(select => {
    select.addEventListener('change', cargarFacturas);
});

// Listener para filtros por estado
document.querySelectorAll('.filtro-estado .btn-estado').forEach(button => {
    button.addEventListener('click', function() {
        const estado = this.getAttribute('data-estado');
        aplicarFiltroEstado(estado);
    });
});

// Función para aplicar filtro por estado
function aplicarFiltroEstado(estado) {
    // Asignar el valor del estado al filtro (puedes manejarlo con una variable global si es necesario)
    window.filtroEstado = estado;
    cargarFacturas();
}

// Listener para ordenar
document.getElementById('ordenar-por').addEventListener('change', cargarFacturas);

// Listeners para búsquedas
document.getElementById('buscar-factura').addEventListener('input', cargarFacturas);
document.getElementById('buscar-boleta').addEventListener('input', cargarFacturas);

// Listener para exportar reporte desde el modal de reporte
// (Ya implementado arriba)

// Listener para exportar tabla principal desde el botón "Exportar Tabla"
// (Ya implementado arriba)
