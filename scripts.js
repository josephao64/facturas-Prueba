// Facturas de ejemplo (ahora con múltiples boletas por factura y dos nuevas facturas)
const facturas = [
    {
        monto: 100.50,
        saldoPendiente: 100.50,
        sucursal: 'Sucursal 1',
        estado: 'Pendiente',
        boletas: []
    },
    {
        monto: 200.00,
        saldoPendiente: 200.00,
        sucursal: 'Sucursal 1',
        estado: 'Pendiente',
        boletas: []
    },
    {
        monto: 150.75,
        saldoPendiente: 150.75,
        sucursal: 'Sucursal 2',
        estado: 'Pendiente',
        boletas: []
    },
    {
        monto: 300.50,
        saldoPendiente: 300.50,
        sucursal: 'Sucursal 2',
        estado: 'Pendiente',
        boletas: []
    },
    {
        monto: 500.00,
        saldoPendiente: 500.00,
        sucursal: 'Sucursal 3',
        estado: 'Pendiente',
        boletas: []
    },
    {
        monto: 650.00,
        saldoPendiente: 650.00,
        sucursal: 'Sucursal 3',
        estado: 'Pendiente',
        boletas: []
    }
];

// Lista de facturas seleccionadas
let facturasSeleccionadas = [];

// Renderizar facturas en la tabla
function renderFacturas() {
    const tableBody = document.getElementById('facturas-table');
    tableBody.innerHTML = '';
    facturas.forEach((factura, index) => {
        const row = document.createElement('tr');

        // Asigna color según estado: Sin pago (rojo), Pendiente (amarillo), Pagada (verde)
        if (factura.boletas.length === 0) {
            row.classList.add('sin-pago');
        } else if (factura.saldoPendiente > 0) {
            row.classList.add('pendiente');
        } else {
            row.classList.add('pagada');
        }

        row.innerHTML = `
            <td><input type="checkbox" class="factura-checkbox" data-index="${index}" data-monto="${factura.saldoPendiente}"></td>
            <td>${factura.monto.toFixed(2)}</td>
            <td id="saldo-${index}">${factura.saldoPendiente.toFixed(2)}</td>
            <td>${factura.sucursal}</td>
            <td id="estado-${index}" class="estado">
                ${factura.saldoPendiente === 0 ? 'Pagada' : (factura.boletas.length > 0 ? 'Pendiente' : 'Sin pago')}
            </td>
            <td id="boleta-${index}">${factura.boletas.length > 0 ? factura.boletas.map(boleta => boleta.boletaId).join(', ') : 'N/A'}</td>
            <td>
                <button class="btn" id="ver-pago-${index}" onclick="verPago(${index})" ${factura.boletas.length > 0 ? '' : 'disabled'}>Ver Pago Realizado</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Evento para habilitar/deshabilitar el botón cuando se seleccionan facturas
document.addEventListener('change', function (event) {
    if (event.target.classList.contains('factura-checkbox')) {
        const index = event.target.dataset.index;
        const saldoPendiente = parseFloat(event.target.dataset.monto);
        
        if (event.target.checked) {
            facturasSeleccionadas.push({ index, saldoPendiente });
        } else {
            facturasSeleccionadas = facturasSeleccionadas.filter(factura => factura.index !== index);
        }

        // Habilitar el botón si hay al menos una factura seleccionada
        document.getElementById('aplicar-pago').disabled = facturasSeleccionadas.length === 0;
    }
});

// Función para validar el monto de pago
function validarPago() {
    const montoTotal = parseFloat(document.getElementById('monto').value);
    let saldoTotal = facturasSeleccionadas.reduce((acc, facturaSeleccionada) => acc + facturaSeleccionada.saldoPendiente, 0);

    if (isNaN(montoTotal) || montoTotal <= 0) {
        alert('Por favor ingrese un monto válido.');
        return false;
    }

    if (montoTotal > saldoTotal) {
        alert('El monto ingresado excede el saldo pendiente total.');
        return false;
    }

    return true;
}

// Aplicar pagos a las facturas seleccionadas
document.getElementById('aplicar-pago').addEventListener('click', function () {
    if (!validarPago()) return;

    const montoTotal = parseFloat(document.getElementById('monto').value);
    const fechaPago = document.getElementById('fecha').value;
    const numeroBoleta = document.getElementById('numero-boleta').value;

    if (!fechaPago || !numeroBoleta) {
        alert('Por favor complete todos los campos: fecha y número de boleta.');
        return;
    }

    let montoRestante = montoTotal;

    facturasSeleccionadas.forEach(facturaSeleccionada => {
        const factura = facturas[facturaSeleccionada.index];
        let pagoAplicado = 0;

        if (montoRestante >= factura.saldoPendiente) {
            pagoAplicado = factura.saldoPendiente;
            montoRestante -= factura.saldoPendiente;
            factura.saldoPendiente = 0;
            factura.estado = 'Pagada';
        } else {
            pagoAplicado = montoRestante;
            factura.saldoPendiente -= montoRestante;
            montoRestante = 0;
            factura.estado = 'Pendiente';
        }

        // Agregar la boleta a la factura
        factura.boletas.push({
            boletaId: numeroBoleta,
            monto: parseFloat(pagoAplicado), // Asegurarse de que el monto sea numérico
            fecha: fechaPago
        });

        document.getElementById(`saldo-${facturaSeleccionada.index}`).innerText = factura.saldoPendiente.toFixed(2);
        document.getElementById(`estado-${facturaSeleccionada.index}`).innerText = factura.estado;

        // Cambiar el color de la fila según el nuevo estado
        const row = document.querySelector(`tr td input[data-index="${facturaSeleccionada.index}"]`).parentElement.parentElement;
        row.classList.toggle('pagada', factura.saldoPendiente === 0);
        row.classList.toggle('pendiente', factura.saldoPendiente > 0);
        row.classList.toggle('sin-pago', factura.boletas.length === 0);

        document.getElementById(`boleta-${facturaSeleccionada.index}`).innerText = factura.boletas.map(boleta => boleta.boletaId).join(', ');
        document.getElementById(`ver-pago-${facturaSeleccionada.index}`).disabled = false;
    });

    alert(`Pago aplicado con éxito. Fecha: ${fechaPago}, Número de Boleta: ${numeroBoleta}`);

    // Limpiar el formulario
    document.getElementById('monto').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('numero-boleta').value = '';

    // Deshabilitar el botón de aplicar pago
    document.getElementById('aplicar-pago').disabled = true;

    // Desmarcar todas las casillas
    const checkboxes = document.querySelectorAll('.factura-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    // Limpiar la lista de facturas seleccionadas
    facturasSeleccionadas = [];
});

// Función para ver los detalles del pago realizado
function verPago(index) {
    const factura = facturas[index];
    const modal = document.getElementById('modal');
    const detallesPago = document.getElementById('detalles-pago');

    if (factura.boletas.length > 0) {
        const boletasDetalles = factura.boletas.map(boleta => `
            <strong>Boleta ID:</strong> ${boleta.boletaId}<br>
            <strong>Monto Pagado:</strong> ${boleta.monto.toFixed(2)}<br>
            <strong>Fecha de Pago:</strong> ${boleta.fecha}
        `).join('<hr>');
        
        detallesPago.innerHTML = boletasDetalles;
        modal.style.display = 'flex';
    }
}

// Cerrar el modal cuando se haga clic en la "x"
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Función para generar el reporte con facturas y boletas asociadas
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = '';

    facturas.forEach((factura, index) => {
        if (factura.boletas.length > 0) {
            const rowCount = factura.boletas.length;

            // Fila para la factura y primera boleta
            const filaFactura = document.createElement('tr');
            filaFactura.innerHTML = `
                <td rowspan="${rowCount}">Factura ${index + 1}</td>
                <td rowspan="${rowCount}">${factura.monto.toFixed(2)}</td>
                <td rowspan="${rowCount}">${factura.saldoPendiente.toFixed(2)}</td>
                <td rowspan="${rowCount}">${factura.sucursal}</td>
                <td rowspan="${rowCount}">${factura.estado}</td>
                <td>${factura.boletas[0].boletaId}</td>
                <td>${factura.boletas[0].fecha}</td>
                <td>${factura.boletas[0].monto.toFixed(2)}</td>
            `;
            reporteContenido.appendChild(filaFactura);

            // Filas para las siguientes boletas de la misma factura
            for (let i = 1; i < rowCount; i++) {
                const filaBoleta = document.createElement('tr');
                filaBoleta.innerHTML = `
                    <td>${factura.boletas[i].boletaId}</td>
                    <td>${factura.boletas[i].fecha}</td>
                    <td>${factura.boletas[i].monto.toFixed(2)}</td>
                `;
                reporteContenido.appendChild(filaBoleta);
            }
        } else {
            // Si la factura no tiene boletas
            const filaFactura = document.createElement('tr');
            filaFactura.innerHTML = `
                <td>Factura ${index + 1}</td>
                <td>${factura.monto.toFixed(2)}</td>
                <td>${factura.saldoPendiente.toFixed(2)}</td>
                <td>${factura.sucursal}</td>
                <td>${factura.estado}</td>
                <td colspan="3">Sin boletas</td>
            `;
            reporteContenido.appendChild(filaFactura);
        }
    });

    document.getElementById('reporte-section').style.display = 'block';
}

// Añadir el evento de clic para generar el reporte
document.getElementById('generar-reporte').addEventListener('click', generarReporte);

// Inicializar la tabla de facturas al cargar la página
window.onload = renderFacturas;
