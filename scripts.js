// scripts.js

// Crear/abrir la base de datos de IndexedDB
let db;
const request = indexedDB.open("GestionDB", 2);

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
    cargarEmpresasFiltro();
    cargarSucursalesFiltro();
    cargarProveedoresFiltro();
    cargarProveedores();
    cargarFacturas();
    cargarSucursalesPago();
};

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event);
};

// Variables globales
let facturasSeleccionadas = [];
let facturaSeleccionada = null;

// Función para cargar sucursales en los selects
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
                fila.innerHTML = `<td colspan="13" style="text-align: center;">No se encontraron facturas que coincidan con los criterios seleccionados.</td>`;
                tableBody.appendChild(fila);
            }
        }
    };
}

// Función para filtrar por estado
function filtrarPorEstado(factura) {
    const filtroEstado = document.querySelector('.filtro-estado .btn-estado.active')?.dataset.estado || 'todas';
    const hoy = new Date();
    const fechaVencimiento = new Date(factura.fechaVencimiento);
    const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

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

// Función para renderizar una factura en la tabla principal
function renderFactura(factura) {
    const tableBody = document.getElementById('facturas-table');
    const row = document.createElement('tr');

    // Asignar clase según estado
    if (factura.boletas.length === 0) {
        row.classList.add('sin-pago');  // Rojo
    } else if (factura.montoPendiente > 0) {
        row.classList.add('pendiente'); // Amarillo
    } else {
        row.classList.add('pagada');    // Verde
    }

    // Obtener los últimos datos de boleta si existen
    const ultimaBoleta = factura.boletas.length > 0 ?
        factura.boletas[factura.boletas.length - 1] : null;

    row.innerHTML = `
        <td><input type="checkbox" class="factura-checkbox" data-id="${factura.id}" data-monto="${factura.montoPendiente}" data-empresa="${factura.empresaNombre}" data-proveedor="${factura.proveedorNombre}"></td>
        <td>${factura.empresaNombre}</td>
        <td>${factura.fechaEmision}</td>
        <td>${factura.numeroFactura}</td>
        <td>Q${factura.montoFactura.toFixed(2)}</td>
        <td>${factura.fechaVencimiento}</td>
        <td id="estado-${factura.id}" class="estado">
            ${factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente'}
        </td>
        <td id="fechaAbono-${factura.id}">${ultimaBoleta ? ultimaBoleta.fecha : 'N/A'}</td>
        <td id="abono-${factura.id}">Q${factura.montoPendiente.toFixed(2)}</td>
        <td id="boleta-${factura.id}">${ultimaBoleta ? ultimaBoleta.boletaId : 'N/A'}</td>
        <td id="banco-${factura.id}">${ultimaBoleta ? ultimaBoleta.banco : 'N/A'}</td>
        <td id="formaPago-${factura.id}">${ultimaBoleta ? ultimaBoleta.formaPago : 'N/A'}</td>
        <td id="quienDeposito-${factura.id}">${ultimaBoleta ? ultimaBoleta.quienDeposito : 'N/A'}</td>
    `;
    tableBody.appendChild(row);
}

// Evento para manejar la selección y deselección de facturas con checkboxes
document.addEventListener('change', function(event) {
    if (event.target.classList.contains('factura-checkbox')) {
        const facturaId = parseInt(event.target.dataset.id);
        const montoPendiente = parseFloat(event.target.dataset.monto);
        const empresa = event.target.dataset.empresa;
        const proveedor = event.target.dataset.proveedor;

        if (event.target.checked) {
            // Verificar reglas antes de agregar
            if (facturasSeleccionadas.length > 0) {
                const primeraFactura = facturasSeleccionadas[0];
                if (primeraFactura.empresa !== empresa) {
                    Swal.fire('Error', 'No se pueden pagar facturas de diferentes empresas juntas.', 'error');
                    event.target.checked = false;
                    return;
                }
                if (primeraFactura.proveedor !== proveedor) {
                    Swal.fire('Error', 'No se pueden pagar facturas de diferentes proveedores juntas.', 'error');
                    event.target.checked = false;
                    return;
                }
            }
            facturasSeleccionadas.push({ id: facturaId, montoPendiente, empresa, proveedor });
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
        editarBtn.disabled = false;
        eliminarBtn.disabled = false;
    } else {
        editarBtn.disabled = true;
        eliminarBtn.disabled = facturasSeleccionadas.length === 0;
    }

    if (facturasSeleccionadas.length > 0) {
        pagarBtn.disabled = false;
    } else {
        pagarBtn.disabled = true;
    }
}

// Actualizar el total pendiente seleccionado
function actualizarTotalPendiente() {
    let totalPendiente = facturasSeleccionadas.reduce((total, factura) =>
        total + parseFloat(factura.montoPendiente), 0);
    document.getElementById('total-pendiente').innerText = `Q${totalPendiente.toFixed(2)}`;
}

// Evento para abrir el modal de pago al hacer clic en "Pagar Facturas"
document.getElementById('pagar-facturas-btn').addEventListener('click', function () {
    if (facturasSeleccionadas.length === 0) {
        Swal.fire('Error', 'Por favor seleccione al menos una factura para pagar.', 'error');
        return;
    }

    const facturasSeleccionadasDiv = document.getElementById('facturas-seleccionadas');
    facturasSeleccionadasDiv.innerHTML = '';

    let totalPendiente = 0;

    facturasSeleccionadas.forEach(factura => {
        // Obtener detalles de la factura para mostrarlos
        const transaction = db.transaction(["facturas", "sucursales", "proveedores", "empresas"], "readonly");
        const facturaStore = transaction.objectStore("facturas");
        const sucursalStore = transaction.objectStore("sucursales");
        const proveedorStore = transaction.objectStore("proveedores");
        const empresaStore = transaction.objectStore("empresas");

        const facturaRequest = facturaStore.get(factura.id);

        facturaRequest.onsuccess = function(event) {
            const facturaData = event.target.result;

            const sucursalRequest = sucursalStore.get(facturaData.sucursalId);
            sucursalRequest.onsuccess = function() {
                const sucursal = sucursalRequest.result;
                const proveedorRequest = proveedorStore.get(facturaData.proveedorId);
                const empresaRequest = empresaStore.get(sucursal.empresaId);

                proveedorRequest.onsuccess = function() {
                    empresaRequest.onsuccess = function() {
                        const empresaNombre = empresaRequest.result.nombre;
                        const sucursalNombre = sucursal.nombre;
                        const proveedorNombre = proveedorRequest.result.nombre;

                        const facturaInfo = document.createElement('p');
                        facturaInfo.innerHTML = `<strong>Factura ID:</strong> ${facturaData.id}, <strong>Empresa:</strong> ${empresaNombre}, <strong>Fecha de Factura:</strong> ${facturaData.fechaEmision}, <strong>Número de Factura:</strong> ${facturaData.numeroFactura}, <strong>Monto Pendiente:</strong> Q${facturaData.montoPendiente.toFixed(2)}`;
                        facturasSeleccionadasDiv.appendChild(facturaInfo);

                        totalPendiente += facturaData.montoPendiente;
                        document.getElementById('total-pendiente-modal').innerText = `Q${totalPendiente.toFixed(2)}`;
                    };
                };
            };
        };
    });

    // Mostrar el modal de pago
    document.getElementById('pago-modal').style.display = 'flex';
});

// Evento para habilitar el botón de aplicar pago al seleccionar sucursal de pago
document.getElementById('sucursal-pago').addEventListener('change', function () {
    const sucursalPagoSeleccionada = this.value;
    document.getElementById('aplicar-pago').disabled =
        facturasSeleccionadas.length === 0 || sucursalPagoSeleccionada === '';
});

// Función para validar el monto de pago y otros campos
function validarPago() {
    const montoTotal = parseFloat(document.getElementById('monto-total').value);
    const bancoSeleccionado = document.getElementById('banco').value;
    const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;
    const formaPagoSeleccionada = document.getElementById('forma-pago').value;

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

    if (formaPagoSeleccionada === "") {
        Swal.fire('Error', 'Por favor seleccione una forma de pago.', 'error');
        return false;
    }

    return true;
}

// Aplicar pagos a las facturas seleccionadas
document.getElementById('aplicar-pago').addEventListener('click', function () {
    if (!validarPago()) return;

    const montoTotal = parseFloat(document.getElementById('monto-total').value);
    const fechaPago = document.getElementById('fecha-pago').value;
    const numeroBoleta = document.getElementById('numero-boleta').value.trim();
    const bancoSeleccionado = document.getElementById('banco').value;
    const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;
    const formaPagoSeleccionada = document.getElementById('forma-pago').value;

    if (!fechaPago || !numeroBoleta || bancoSeleccionado === "" ||
        sucursalPagoSeleccionada === "" || formaPagoSeleccionada === "") {
        Swal.fire('Error', 'Complete todos los campos: fecha, número de boleta, banco, sucursal y forma de pago.', 'error');
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
                    fecha: fechaPago,
                    banco: bancoSeleccionado,
                    formaPago: formaPagoSeleccionada,
                    quienDeposito: sucursalPagoSeleccionada
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
                    <strong>Forma de Pago:</strong> ${formaPagoSeleccionada}<br>
                    <strong>Sucursal para el Pago (Quién Depositó):</strong> ${sucursalPagoSeleccionada}
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
            document.getElementById('forma-pago').value = '';
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
                <strong>ID Boleta:</strong> ${boleta.boletaId}<br>
                <strong>Monto Aplicado:</strong> Q${boleta.montoAplicado.toFixed(2)}<br>
                <strong>Fecha de Abono:</strong> ${boleta.fecha}<br>
                <strong>Banco:</strong> ${boleta.banco}<br>
                <strong>Forma de Pago:</strong> ${boleta.formaPago}<br>
                <strong>Quién Depositó:</strong> ${boleta.quienDeposito}<br>
            `).join('<hr>');

            detallesPago.innerHTML = boletasDetalles;
            modal.style.display = 'flex';
        }
    };
}

// Cerrar los modales cuando se haga clic en la "x"
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
});

// Funcionalidad de Agregar y Editar Facturas

// Event listener para el botón "Agregar Factura"
document.getElementById('agregar-factura-btn').addEventListener('click', function() {
    abrirModalFactura();
});

// Event listener para cerrar el modal de factura
document.getElementById('close-factura-modal').addEventListener('click', function() {
    cerrarModalFactura();
});

// Función para abrir el modal de agregar factura
function abrirModalFactura() {
    document.getElementById('factura-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Agregar Nueva Factura';
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
    limpiarFormularioFactura();
}

// Función para cerrar el modal de agregar factura
function cerrarModalFactura() {
    document.getElementById('factura-modal').style.display = 'none';
    limpiarFormularioFactura();
}

// Función para limpiar el formulario de factura
function limpiarFormularioFactura() {
    document.getElementById('sucursal-factura').value = '';
    document.getElementById('proveedor-factura').value = '';
    document.getElementById('dias-credito-factura').value = '';
    document.getElementById('numero-factura').value = '';
    document.getElementById('fecha-emision').value = '';
    document.getElementById('fecha-vencimiento').value = '';
    document.getElementById('monto-factura').value = '';
}

// Event listener para seleccionar un proveedor y cargar los días de crédito
document.getElementById('proveedor-factura').addEventListener('change', function() {
    const proveedorId = this.value;
    if (proveedorId) {
        obtenerDiasCredito(proveedorId);
    } else {
        document.getElementById('dias-credito-factura').value = '';
    }
});

// Función para obtener los días de crédito de un proveedor
function obtenerDiasCredito(proveedorId) {
    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");
    const request = proveedorStore.get(proveedorId);

    request.onsuccess = function(event) {
        const proveedor = event.target.result;
        document.getElementById('dias-credito-factura').value = proveedor.diasCredito || '';
        if (proveedor.diasCredito) {
            const fechaEmision = document.getElementById('fecha-emision').value;
            if (fechaEmision) {
                calcularFechaVencimiento(fechaEmision, proveedor.diasCredito);
            }
        }
    };
}

// Event listener para cambiar la fecha de emisión y calcular la fecha de vencimiento
document.getElementById('fecha-emision').addEventListener('change', function() {
    const fechaEmision = this.value;
    const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);
    if (fechaEmision && !isNaN(diasCredito)) {
        calcularFechaVencimiento(fechaEmision, diasCredito);
    }
});

// Función para calcular la fecha de vencimiento
function calcularFechaVencimiento(fechaEmision, diasCredito) {
    const fecha = new Date(fechaEmision);
    fecha.setDate(fecha.getDate() + diasCredito);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Enero es 0
    const anio = fecha.getFullYear();
    document.getElementById('fecha-vencimiento').value = `${anio}-${mes}-${dia}`;
}

// Event listener para el botón "Guardar Factura"
document.getElementById('guardar-factura').addEventListener('click', function() {
    agregarFactura();
});

// Event listener para el botón "Actualizar Factura"
document.getElementById('actualizar-factura').addEventListener('click', function() {
    actualizarFactura();
});

// Función para agregar una nueva factura a IndexedDB
function agregarFactura() {
    const sucursalId = parseInt(document.getElementById('sucursal-factura').value);
    const proveedorId = parseInt(document.getElementById('proveedor-factura').value);
    const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);

    // Validaciones
    if (!sucursalId || !proveedorId || !diasCredito || !numeroFactura || !fechaEmision || !fechaVencimiento || isNaN(montoFactura) || montoFactura <= 0) {
        Swal.fire('Error', 'Por favor complete todos los campos correctamente.', 'error');
        return;
    }

    const nuevaFactura = {
        sucursalId,
        proveedorId,
        diasCredito,
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        montoFactura,
        montoPendiente: montoFactura,
        estado: 'Pendiente',
        boletas: []
    };

    const transaction = db.transaction(["facturas"], "readwrite");
    const facturaStore = transaction.objectStore("facturas");
    const request = facturaStore.add(nuevaFactura);

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Factura agregada correctamente.', 'success');
        cerrarModalFactura();
        cargarFacturas();
    };

    request.onerror = function(event) {
        console.error("Error al agregar la factura:", event.target.error);
        Swal.fire('Error', 'No se pudo agregar la factura.', 'error');
    };
}

// Función para actualizar una factura existente en IndexedDB
function actualizarFactura() {
    if (!facturaSeleccionada) {
        Swal.fire('Error', 'No se ha seleccionado ninguna factura para actualizar.', 'error');
        return;
    }

    const sucursalId = parseInt(document.getElementById('sucursal-factura').value);
    const proveedorId = parseInt(document.getElementById('proveedor-factura').value);
    const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);

    // Validaciones
    if (!sucursalId || !proveedorId || !diasCredito || !numeroFactura || !fechaEmision || !fechaVencimiento || isNaN(montoFactura) || montoFactura <= 0) {
        Swal.fire('Error', 'Por favor complete todos los campos correctamente.', 'error');
        return;
    }

    const transaction = db.transaction(["facturas"], "readwrite");
    const facturaStore = transaction.objectStore("facturas");
    const request = facturaStore.get(facturaSeleccionada);

    request.onsuccess = function(event) {
        const factura = event.target.result;
        factura.sucursalId = sucursalId;
        factura.proveedorId = proveedorId;
        factura.diasCredito = diasCredito;
        factura.numeroFactura = numeroFactura;
        factura.fechaEmision = fechaEmision;
        factura.fechaVencimiento = fechaVencimiento;
        factura.montoFactura = montoFactura;
        factura.montoPendiente = montoFactura - (factura.montoFactura - factura.montoPendiente); // Ajustar monto pendiente si se actualiza el monto total
        factura.estado = factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente';

        const updateRequest = facturaStore.put(factura);

        updateRequest.onsuccess = function() {
            Swal.fire('Éxito', 'Factura actualizada correctamente.', 'success');
            cerrarModalFactura();
            cargarFacturas();
            facturasSeleccionadas = [];
            facturaSeleccionada = null;
            actualizarBotonesAccion();
        };

        updateRequest.onerror = function(event) {
            console.error("Error al actualizar la factura:", event.target.error);
            Swal.fire('Error', 'No se pudo actualizar la factura.', 'error');
        };
    };

    request.onerror = function(event) {
        console.error("Error al obtener la factura para actualizar:", event.target.error);
        Swal.fire('Error', 'No se pudo obtener la factura para actualizar.', 'error');
    };
}

// Función para editar una factura seleccionada
document.getElementById('editar-factura-btn').addEventListener('click', function() {
    if (facturasSeleccionadas.length !== 1) {
        Swal.fire('Error', 'Por favor seleccione una sola factura para editar.', 'error');
        return;
    }

    const facturaId = facturasSeleccionadas[0].id;

    const transaction = db.transaction(["facturas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");
    const request = facturaStore.get(facturaId);

    request.onsuccess = function(event) {
        const factura = event.target.result;
        abrirModalEditarFactura(factura);
    };

    request.onerror = function(event) {
        console.error("Error al obtener la factura para editar:", event.target.error);
        Swal.fire('Error', 'No se pudo obtener la factura para editar.', 'error');
    };
});

// Función para abrir el modal de editar factura con datos prellenados
function abrirModalEditarFactura(factura) {
    document.getElementById('factura-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Editar Factura';
    document.getElementById('guardar-factura').style.display = 'none';
    document.getElementById('actualizar-factura').style.display = 'inline-block';

    document.getElementById('sucursal-factura').value = factura.sucursalId;
    document.getElementById('proveedor-factura').value = factura.proveedorId;
    document.getElementById('dias-credito-factura').value = factura.diasCredito;
    document.getElementById('numero-factura').value = factura.numeroFactura;
    document.getElementById('fecha-emision').value = factura.fechaEmision;
    document.getElementById('fecha-vencimiento').value = factura.fechaVencimiento;
    document.getElementById('monto-factura').value = factura.montoFactura;
}

// Funcionalidad de Eliminar Facturas

// Event listener para el botón "Eliminar Factura"
document.getElementById('eliminar-factura-btn').addEventListener('click', function() {
    if (facturasSeleccionadas.length === 0) {
        Swal.fire('Error', 'Por favor seleccione al menos una factura para eliminar.', 'error');
        return;
    }

    Swal.fire({
        title: '¿Estás seguro?',
        text: `¿Deseas eliminar ${facturasSeleccionadas.length} factura(s)?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarFacturas();
        }
    });
});

// Función para eliminar las facturas seleccionadas
function eliminarFacturas() {
    const transaction = db.transaction(["facturas"], "readwrite");
    const facturaStore = transaction.objectStore("facturas");

    facturasSeleccionadas.forEach(factura => {
        facturaStore.delete(factura.id);
    });

    transaction.oncomplete = function() {
        Swal.fire('Éxito', 'Facturas eliminadas correctamente.', 'success');
        facturasSeleccionadas = [];
        facturaSeleccionada = null;
        actualizarTotalPendiente();
        actualizarBotonesAccion();
        cargarFacturas();
    };

    transaction.onerror = function(event) {
        console.error("Error al eliminar las facturas:", event.target.error);
        Swal.fire('Error', 'No se pudieron eliminar las facturas.', 'error');
    };
}

// Funcionalidad de Exportación y Reportes

// Función para generar el reporte con facturas y boletas asociadas
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = '';

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
            <td rowspan="${rowCount}">${factura.fechaEmision}</td>
            <td rowspan="${rowCount}">${factura.numeroFactura}</td>
            <td rowspan="${rowCount}">Q${factura.montoFactura.toFixed(2)}</td>
            <td rowspan="${rowCount}">${factura.fechaVencimiento}</td>
            <td rowspan="${rowCount}">${factura.estado}</td>
            <td rowspan="${rowCount}">${factura.boletas[0].fecha}</td>
            <td rowspan="${rowCount}">Q${factura.boletas[0].montoAplicado.toFixed(2)}</td>
            <td>${factura.boletas[0].boletaId}</td>
            <td>${factura.boletas[0].banco}</td>
            <td>${factura.boletas[0].formaPago}</td>
            <td>${factura.boletas[0].quienDeposito}</td>
        `;
        reporteContenido.appendChild(filaFactura);

        // Filas para las siguientes boletas de la misma factura
        for (let i = 1; i < rowCount; i++) {
            const filaBoleta = document.createElement('tr');
            filaBoleta.innerHTML = `
                <td>${factura.boletas[i].boletaId}</td>
                <td>${factura.boletas[i].banco}</td>
                <td>${factura.boletas[i].formaPago}</td>
                <td>${factura.boletas[i].quienDeposito}</td>
            `;
            reporteContenido.appendChild(filaBoleta);
        }
    } else {
        // Si la factura no tiene boletas
        const filaFactura = document.createElement('tr');
        filaFactura.innerHTML = `
            <td>${factura.empresaNombre}</td>
            <td>${factura.fechaEmision}</td>
            <td>${factura.numeroFactura}</td>
            <td>Q${factura.montoFactura.toFixed(2)}</td>
            <td>${factura.fechaVencimiento}</td>
            <td>${factura.estado}</td>
            <td>N/A</td>
            <td>N/A</td>
            <td colspan="4">Sin boletas</td>
        `;
        reporteContenido.appendChild(filaFactura);
    }
}

// Listener para el botón "Generar Reporte"
document.getElementById('generar-reporte-btn').addEventListener('click', generarReporte);

// Función para cerrar el modal de reporte
document.getElementById('close-reporte-modal').addEventListener('click', function() {
    document.getElementById('reporte-modal').style.display = 'none';
});

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

// Listener para exportar la tabla con una alerta para escoger el formato
document.getElementById('exportar-tabla-btn').addEventListener('click', function() {
    Swal.fire({
        title: 'Exportar Tabla',
        text: 'Elige el formato en el que deseas exportar la tabla:',
        icon: 'question',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'PDF',
        denyButtonText: 'Imagen',
        cancelButtonText: 'Excel'
    }).then((result) => {
        if (result.isConfirmed) {
            exportToPDF();
        } else if (result.isDenied) {
            exportToImage();
        } else if (result.isDismissed) {
            exportToExcel();
        }
    });
});

// Funciones para exportar desde el reporte modal
document.getElementById('export-excel').addEventListener('click', exportToExcel);
document.getElementById('export-pdf').addEventListener('click', exportToPDF);
document.getElementById('export-image').addEventListener('click', exportToImage);

// ==================== Funcionalidad de Agregar y Editar Facturas ====================

// Event listener para el botón "Agregar Factura"
document.getElementById('agregar-factura-btn').addEventListener('click', function() {
    abrirModalFactura();
});

// Event listener para cerrar el modal de factura
document.getElementById('close-factura-modal').addEventListener('click', function() {
    cerrarModalFactura();
});

// Función para abrir el modal de agregar factura
function abrirModalFactura() {
    document.getElementById('factura-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = 'Agregar Nueva Factura';
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
    limpiarFormularioFactura();
}

// Función para cerrar el modal de agregar factura
function cerrarModalFactura() {
    document.getElementById('factura-modal').style.display = 'none';
    limpiarFormularioFactura();
}

// Función para limpiar el formulario de factura
function limpiarFormularioFactura() {
    document.getElementById('sucursal-factura').value = '';
    document.getElementById('proveedor-factura').value = '';
    document.getElementById('dias-credito-factura').value = '';
    document.getElementById('numero-factura').value = '';
    document.getElementById('fecha-emision').value = '';
    document.getElementById('fecha-vencimiento').value = '';
    document.getElementById('monto-factura').value = '';
}

// ==================== Finalización ====================
