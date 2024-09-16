// gestionar.js

// Crear/abrir la base de datos de IndexedDB
let db;
const request = indexedDB.open("GestionDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;

    if (!db.objectStoreNames.contains('empresas')) {
        db.createObjectStore("empresas", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('sucursales')) {
        const sucursalStore = db.createObjectStore("sucursales", { keyPath: "id", autoIncrement: true });
        sucursalStore.createIndex("empresaId", "empresaId", { unique: false });
    }
    if (!db.objectStoreNames.contains('proveedores')) {
        db.createObjectStore("proveedores", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    cargarEmpresas();
    cargarSucursales();
    cargarProveedores();
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

// Función para agregar empresa
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

// Función para cargar empresas en el select y listado
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

// Función para agregar sucursal
document.getElementById('agregar-sucursal').addEventListener('click', function() {
    const empresaId = document.getElementById('empresa-sucursal').value;
    const nombreSucursal = document.getElementById('nombre-sucursal').value;
    if (nombreSucursal === '' || !empresaId) {
        Swal.fire('Error', 'El nombre de la sucursal y la empresa deben estar seleccionados', 'error');
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

// Función para cargar sucursales en el listado
function cargarSucursales() {
    const sucursalLista = document.getElementById('lista-sucursales');
    sucursalLista.innerHTML = '';
    const transaction = db.transaction(["sucursales", "empresas"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");
    const empresaStore = transaction.objectStore("empresas");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const li = document.createElement('li');
            // Obtener el nombre de la empresa asociada
            const empresaRequest = empresaStore.get(cursor.value.empresaId);
            empresaRequest.onsuccess = function() {
                const empresaNombre = empresaRequest.result ? empresaRequest.result.nombre : 'Empresa desconocida';
                li.textContent = `${cursor.value.nombre} (Empresa: ${empresaNombre})`;
                sucursalLista.appendChild(li);
            };
            cursor.continue();
        }
    };
}

// Función para agregar proveedor
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

// Función para cargar proveedores en el listado
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
