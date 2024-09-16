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
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    cargarSucursales();
    cargarProveedores();
    cargarFacturas();
    cargarSucursalesPago();
    cargarSucursalesFiltro();
    cargarEmpresasFiltro();
    cargarProveedoresFiltro();
};

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event);
};

// Variables globales
let facturasSeleccionadas = [];

// Función para cargar sucursales en los select
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

// Función para cargar proveedores en los select
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

                        // Renderizar la factura en la tabla
                        renderFactura(factura);
                    };
                };
            };

            cursor.continue();
        }
    };
}

// Función para renderizar una factura
function renderFactura(factura) {
    const tableBody = document.getElementById('facturas-table');
    const row = document.createElement('tr');

    // Asignar color según estado
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
        <td><input type="checkbox" class="factura-checkbox" data-id="${factura.id}" data-monto="${factura.montoPendiente}"></td>
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
            ${ultimaBoleta ? `Q${ultimaBoleta.montoAplicado.toFixed(2)}` : 'N/A'}</td>
        <td id="banco-${factura.id}">${ultimaBoleta ? ultimaBoleta.banco : 'N/A'}</td>
        <td>
            <button class="btn" onclick="verPago(${factura.id})"
                ${factura.boletas.length > 0 ? '' : 'disabled'}>
                Ver Pago Realizado</button>
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
        eliminarBtn.disabled = true;
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

    facturasSeleccionadas.forEach(factura => {
        const facturaInfo = document.createElement('p');
        facturaInfo.textContent = `Factura ID: ${factura.id}, Monto Pendiente: Q${factura.montoPendiente.toFixed(2)}`;
        facturasSeleccionadasDiv.appendChild(facturaInfo);
    });

    // Habilitar o deshabilitar el botón "Aplicar Pago" según los campos de sucursal
    const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;
    document.getElementById('aplicar-pago').disabled =
        facturasSeleccionadas.length === 0 || sucursalPagoSeleccionada === '';

    // Mostrar el modal de pago
    document.getElementById('pago-modal').style.display = 'flex';
});

// Evento para habilitar el botón de aplicar pago al seleccionar sucursal de pago
document.getElementById('sucursal-pago').addEventListener('change', function () {
    const sucursalPagoSeleccionada = this.value;
    document.getElementById('aplicar-pago').disabled =
        facturasSeleccionadas.length === 0 || sucursalPagoSeleccionada === '';
});

// Función para validar el monto de pago
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

// Aplicar pagos a las facturas seleccionadas
document.getElementById('aplicar-pago').addEventListener('click', function () {
    if (!validarPago()) return;

    const montoTotal = parseFloat(document.getElementById('monto-total').value);
    const fechaPago = document.getElementById('fecha-pago').value;
    const numeroBoleta = document.getElementById('numero-boleta').value;
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
                text: `Fecha: ${fechaPago}, Número de Boleta: ${numeroBoleta}, Banco: ${bancoSeleccionado}, Sucursal: ${sucursalPagoSeleccionada}`,
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

document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
});

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

// Función para cerrar el modal de reporte
document.getElementById('close-reporte-modal').addEventListener('click', function() {
    document.getElementById('reporte-modal').style.display = 'none';
});

// Exportar el reporte a Excel
document.getElementById('export-excel').addEventListener('click', function() {
    const reporteTable = document.getElementById('reporte-table');
    const workbook = XLSX.utils.table_to_book(reporteTable, {sheet: "Reporte"});
    XLSX.writeFile(workbook, 'Reporte_Facturas.xlsx');
});

// Exportar el reporte a PDF
document.getElementById('export-pdf').addEventListener('click', function() {
    const reporteTable = document.getElementById('reporte-table');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    
    doc.autoTable({ html: '#reporte-table', startY: 50 });
    doc.save('Reporte_Facturas.pdf');
});

// Exportar el reporte a Imagen
document.getElementById('export-image').addEventListener('click', function() {
    const reporteModalContent = document.getElementById('reporte-modal').querySelector('.modal-content');

    html2canvas(reporteModalContent).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'Reporte_Facturas.png';
        link.click();
    });
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

document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
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

// Función para cerrar el modal de reporte
document.getElementById('close-reporte-modal').addEventListener('click', function() {
    document.getElementById('reporte-modal').style.display = 'none';
});

// Listener para abrir el modal de reporte al hacer clic en "Generar Reporte"
document.getElementById('generar-reporte-btn').addEventListener('click', function() {
    generarReporte();
});

// Listener para exportar el reporte a Excel
document.getElementById('export-excel').addEventListener('click', exportToExcel);

// Listener para exportar el reporte a PDF
document.getElementById('export-pdf').addEventListener('click', exportToPDF);

// Listener para exportar el reporte a Imagen
document.getElementById('export-image').addEventListener('click', exportToImage);
