// Crear/abrir la base de datos de IndexedDB
let db;
const request = indexedDB.open("GestionDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const empresaStore = db.createObjectStore("empresas", { keyPath: "id", autoIncrement: true });
    const sucursalStore = db.createObjectStore("sucursales", { keyPath: "id", autoIncrement: true });
    const proveedorStore = db.createObjectStore("proveedores", { keyPath: "id", autoIncrement: true });
    sucursalStore.createIndex("empresaId", "empresaId", { unique: false });

    // Crear el store para las facturas
    const facturaStore = db.createObjectStore("facturas", { keyPath: "id", autoIncrement: true });
    facturaStore.createIndex("sucursalId", "sucursalId", { unique: false });
    facturaStore.createIndex("proveedorId", "proveedorId", { unique: false });
};

request.onsuccess = function(event) {
    db = event.target.result;
    cargarEmpresas();
    cargarSucursales();
    cargarProveedores();
    cargarFacturas();
};

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event);
};

// Función para abrir pestañas
function openTab(event, tabName) {
    const tabs = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}

// Funciones para agregar datos a la base de datos
document.getElementById('agregar-empresa').addEventListener('click', function() {
    const nombreEmpresa = document.getElementById('nombre-empresa').value;
    if (nombreEmpresa === '') {
        Swal.fire('Error', 'El nombre de la empresa no puede estar vacío', 'error');
        return;
    }
    const transaction = db.transaction(["empresas"], "readwrite");
    const empresaStore = transaction.objectStore("empresas");
    empresaStore.add({ nombre: nombreEmpresa });

    transaction.oncomplete = function() {
        Swal.fire('Éxito', 'Empresa agregada correctamente', 'success');
        cargarEmpresas();
        document.getElementById('nombre-empresa').value = '';
    };
});

function cargarEmpresas() {
    const empresaSelect = document.getElementById('empresa-sucursal');
    empresaSelect.innerHTML = '';
    const empresaLista = document.getElementById('lista-empresas');
    empresaLista.innerHTML = '';
    const transaction = db.transaction(["empresas"], "readonly");
    const empresaStore = transaction.objectStore("empresas");

    empresaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const option = document.createElement('option');
            option.value = cursor.value.id;
            option.textContent = cursor.value.nombre;
            empresaSelect.appendChild(option);

            const li = document.createElement('li');
            li.textContent = cursor.value.nombre;
            empresaLista.appendChild(li);
            cursor.continue();
        }
    };
}

document.getElementById('agregar-sucursal').addEventListener('click', function() {
    const empresaId = document.getElementById('empresa-sucursal').value;
    const nombreSucursal = document.getElementById('nombre-sucursal').value;
    if (nombreSucursal === '') {
        Swal.fire('Error', 'El nombre de la sucursal no puede estar vacío', 'error');
        return;
    }

    const transaction = db.transaction(["sucursales"], "readwrite");
    const sucursalStore = transaction.objectStore("sucursales");
    sucursalStore.add({ nombre: nombreSucursal, empresaId: parseInt(empresaId) });

    transaction.oncomplete = function() {
        Swal.fire('Éxito', 'Sucursal agregada correctamente', 'success');
        cargarSucursales();
        document.getElementById('nombre-sucursal').value = '';
    };
});

function cargarSucursales() {
    const sucursalLista = document.getElementById('lista-sucursales');
    sucursalLista.innerHTML = '';
    const transaction = db.transaction(["sucursales"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const li = document.createElement('li');
            li.textContent = cursor.value.nombre;
            sucursalLista.appendChild(li);
            cursor.continue();
        }
    };
}

document.getElementById('agregar-proveedor').addEventListener('click', function() {
    const nombreProveedor = document.getElementById('nombre-proveedor').value;
    const diasCredito = parseInt(document.getElementById('dias-credito').value);
    if (nombreProveedor === '' || isNaN(diasCredito)) {
        Swal.fire('Error', 'Debe ingresar un nombre de proveedor y días de crédito válidos', 'error');
        return;
    }

    const transaction = db.transaction(["proveedores"], "readwrite");
    const proveedorStore = transaction.objectStore("proveedores");
    proveedorStore.add({ nombre: nombreProveedor, diasCredito });

    transaction.oncomplete = function() {
        Swal.fire('Éxito', 'Proveedor agregado correctamente', 'success');
        cargarProveedores();
        document.getElementById('nombre-proveedor').value = '';
        document.getElementById('dias-credito').value = '';
    };
});

function cargarProveedores() {
    const proveedorLista = document.getElementById('lista-proveedores');
    proveedorLista.innerHTML = '';
    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    proveedorStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const li = document.createElement('li');
            li.textContent = `${cursor.value.nombre} - ${cursor.value.diasCredito} días de crédito`;
            proveedorLista.appendChild(li);
            cursor.continue();
        }
    };
}

// Añadir evento al botón para agregar facturas
document.getElementById('agregar-factura').addEventListener('click', function() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value;
    const fechaEmision = document.getElementById('fecha-emision').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);
    
    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision || isNaN(montoFactura)) {
        Swal.fire('Error', 'Complete todos los campos.', 'error');
        return;
    }

    // Obtener los días de crédito del proveedor seleccionado
    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    proveedorStore.get(parseInt(proveedorId)).onsuccess = function(event) {
        const proveedor = event.target.result;
        const diasCredito = proveedor.diasCredito;

        // Calcular la fecha de vencimiento
        const fechaVencimiento = new Date(fechaEmision);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
        const fechaVencimientoString = fechaVencimiento.toISOString().split('T')[0];

        // Guardar la factura en IndexedDB
        const transactionFacturas = db.transaction(["facturas"], "readwrite");
        const facturaStore = transactionFacturas.objectStore("facturas");

        facturaStore.add({
            sucursalId: parseInt(sucursalId),
            proveedorId: parseInt(proveedorId),
            numeroFactura,
            fechaEmision,
            fechaVencimiento: fechaVencimientoString,
            monto: montoFactura,
            estado: 'Pendiente'
        });

        transactionFacturas.oncomplete = function() {
            Swal.fire('Éxito', 'Factura agregada correctamente', 'success');
            cargarFacturas();
        };
    };
});

// Función para cargar las facturas en la tabla
function cargarFacturas() {
    const facturaLista = document.getElementById('lista-facturas');
    facturaLista.innerHTML = '';
    const transaction = db.transaction(["facturas"], "readonly");
    const facturaStore = transaction.objectStore("facturas");

    facturaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cursor.value.sucursalId}</td>
                <td>${cursor.value.proveedorId}</td>
                <td>${cursor.value.numeroFactura}</td>
                <td>${cursor.value.fechaEmision}</td>
                <td>${cursor.value.fechaVencimiento}</td>
                <td>${cursor.value.monto.toFixed(2)}</td>
                <td>${cursor.value.estado}</td>
            `;
            facturaLista.appendChild(row);
            cursor.continue();
        }
    };
}
