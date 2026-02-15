let docentes = [], envios = [], admins = [], usuarioActivo = null, contadorAsignaturas = 0, intervaloActualizacion = null;

window.onload = function() {
    usuarioActivo = verificarSesion(['usuario']);
    if (!usuarioActivo) return;
    
    ['userName', 'welcomeMessage'].forEach(id => 
        document.getElementById(id).textContent = id === 'welcomeMessage' ? `👋 Hola, ${usuarioActivo.nombre}` : usuarioActivo.nombre
    );
    document.getElementById('userRole').textContent = usuarioActivo.cargo || 'Usuario';
    
    cargarDatos();
    cargarAdmins();
    agregarAsignatura();
    actualizarTodo();
    intervaloActualizacion = setInterval(() => { cargarDatos(); cargarAdmins(); actualizarHistorialEnvios(); }, 3000);
    mostrarNotificacion('notificationContainer', '✅ Listo', 'Sistema activado', 'exito');
};

function cargarDatos() {
    docentes = JSON.parse(localStorage.getItem(`docentes_${usuarioActivo.usuario}`) || '[]');
    envios = JSON.parse(localStorage.getItem(`envios_${usuarioActivo.usuario}`) || '[]');
}

function guardarDatos() {
    localStorage.setItem(`docentes_${usuarioActivo.usuario}`, JSON.stringify(docentes));
    localStorage.setItem(`envios_${usuarioActivo.usuario}`, JSON.stringify(envios));
}

function cargarAdmins() {
    admins = obtenerAdminsActivos();
    const selector = document.getElementById('selectorAdmin');
    if (!selector) return;
    selector.innerHTML = '<option value="">Seleccione un admin</option>' + 
        admins.map(a => `<option value="${a.usuario}">🏛️ ${a.nombre}</option>`).join('');
    validarEnvio();
}

function validarEnvio() {
    const btn = document.getElementById('btnEnviar');
    btn.disabled = !document.getElementById('selectorAdmin').value || !document.getElementById('nombreEdificio').value.trim();
}

function setEdificio(e) { document.getElementById('nombreEdificio').value = e; validarEnvio(); }

function agregarAsignatura() {
    const id = contadorAsignaturas++;
    document.getElementById('asignaturasContainer').insertAdjacentHTML('beforeend', `
        <div class="item-asignatura" id="asignatura-${id}">
            <input type="text" id="asignatura-nombre-${id}" placeholder="Asignatura">
            <input type="text" id="asignatura-grupo-${id}" placeholder="Grupo">
            <input type="number" id="asignatura-horas-${id}" placeholder="Horas" min="1" onchange="calcularTotalHoras()">
            <div><button onclick="duplicarAsignatura(${id})" class="btn btn-sm">📋</button>
            <button onclick="eliminarAsignatura(${id})" class="btn btn-sm" style="background:var(--peligro-claro); color:var(--peligro);">✕</button></div>
        </div>
    `);
    calcularTotalHoras();
}

function duplicarAsignatura(id) {
    const n = document.getElementById(`asignatura-nombre-${id}`)?.value;
    const g = document.getElementById(`asignatura-grupo-${id}`)?.value;
    const h = document.getElementById(`asignatura-horas-${id}`)?.value;
    agregarAsignatura();
    const nuevo = contadorAsignaturas - 1;
    if (n) document.getElementById(`asignatura-nombre-${nuevo}`).value = n;
    if (g) document.getElementById(`asignatura-grupo-${nuevo}`).value = g;
    if (h) document.getElementById(`asignatura-horas-${nuevo}`).value = h;
    calcularTotalHoras();
}

function eliminarAsignatura(id) { document.getElementById(`asignatura-${id}`)?.remove(); calcularTotalHoras(); }

function calcularTotalHoras() {
    let total = 0;
    document.querySelectorAll('[id^="asignatura-horas-"]').forEach(i => total += parseInt(i.value) || 0);
    document.getElementById('totalHoras').textContent = total;
    return total;
}

function obtenerAsignaturas() {
    const asig = [];
    for (let i = 0; i < contadorAsignaturas; i++) {
        const n = document.getElementById(`asignatura-nombre-${i}`)?.value;
        if (n?.trim()) asig.push({
            nombre: n.trim(),
            grupo: document.getElementById(`asignatura-grupo-${i}`)?.value || 'Sin grupo',
            horas: parseInt(document.getElementById(`asignatura-horas-${i}`)?.value) || 0
        });
    }
    return asig;
}

function previewFoto(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('photoPreview').src = e.target.result;
            document.getElementById('photoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function agregarDocente() {
    const noEmp = document.getElementById('noEmpleado').value.trim();
    const nom = document.getElementById('nombreDocente').value.trim();
    if (!noEmp || !nom) return mostrarNotificacion('notificationContainer', '❌ Error', 'Empleado y nombre obligatorios', 'error');
    
    const asig = obtenerAsignaturas();
    if (!asig.length) return mostrarNotificacion('notificationContainer', '❌ Error', 'Agregue al menos una asignatura', 'error');
    
    docentes.push({
        id: Date.now(), noEmpleado: noEmp, nombre: nom,
        programaEducativo: document.getElementById('programaEducativo').value.trim(),
        antiguedad: document.getElementById('antiguedad').value.trim(),
        sindicato: document.getElementById('sindicato').value,
        asignaturas: asig, totalHoras: calcularTotalHoras(),
        foto: document.getElementById('photoPreview').style.display !== 'none' ? document.getElementById('photoPreview').src : '',
        fechaRegistro: new Date().toISOString()
    });
    
    guardarDatos();
    actualizarTablaDocentes();
    limpiarFormulario();
    mostrarNotificacion('notificationContainer', '✅ Éxito', 'Docente agregado', 'exito');
}

function editarDocente(id) {
    const d = docentes.find(d => d.id === id);
    if (!d) return;
    
    document.getElementById('asignaturasContainer').innerHTML = '';
    contadorAsignaturas = 0;
    
    ['noEmpleado', 'nombreDocente', 'programaEducativo', 'antiguedad'].forEach(c => 
        document.getElementById(c).value = d[c] || '');
    document.getElementById('sindicato').value = d.sindicato || '';
    
    d.asignaturas.forEach(a => {
        agregarAsignatura();
        const i = contadorAsignaturas - 1;
        document.getElementById(`asignatura-nombre-${i}`).value = a.nombre;
        document.getElementById(`asignatura-grupo-${i}`).value = a.grupo;
        document.getElementById(`asignatura-horas-${i}`).value = a.horas;
    });
    
    if (d.foto) {
        document.getElementById('photoPreview').src = d.foto;
        document.getElementById('photoPreview').style.display = 'block';
    }
    
    docentes = docentes.filter(x => x.id !== id);
    guardarDatos();
    calcularTotalHoras();
    actualizarTablaDocentes();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarDocente(id) {
    if (confirm('¿Eliminar este registro?')) {
        docentes = docentes.filter(d => d.id !== id);
        guardarDatos();
        actualizarTablaDocentes();
        mostrarNotificacion('notificationContainer', '🗑️ Eliminado', 'Registro eliminado', 'advertencia');
    }
}

function limpiarFormulario() {
    ['noEmpleado', 'nombreDocente', 'programaEducativo', 'antiguedad'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('sindicato').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoPreview').src = '';
    document.getElementById('fotoDocente').value = '';
    document.getElementById('asignaturasContainer').innerHTML = '';
    contadorAsignaturas = 0;
    agregarAsignatura();
}

function actualizarTablaDocentes() {
    const tbody = document.getElementById('tbodyDocentes');
    document.getElementById('totalDocentes').textContent = docentes.length;
    document.getElementById('totalRegistros').textContent = docentes.length;
    
    if (!docentes.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">No hay docentes</td></tr>';
        return;
    }
    
    tbody.innerHTML = docentes.map(d => {
        const th = d.asignaturas.reduce((s, a) => s + a.horas, 0);
        return `<tr>
            <td>${d.noEmpleado}</td><td>${d.nombre}</td><td>${d.programaEducativo || '—'}</td>
            <td>${d.asignaturas.map(a => a.nombre).join(', ').substring(0, 30)}...</td>
            <td><strong>${th}</strong></td>
            <td><button onclick="editarDocente(${d.id})" class="btn btn-sm">✏️</button>
            <button onclick="eliminarDocente(${d.id})" class="btn btn-sm" style="background:var(--peligro-claro); color:var(--peligro);">🗑️</button></td>
        </tr>`;
    }).join('');
}

function enviarTabla() {
    if (!docentes.length) return mostrarNotificacion('notificationContainer', '❌ Error', 'No hay registros', 'error');
    
    const adminSel = document.getElementById('selectorAdmin').value;
    const edificio = document.getElementById('nombreEdificio').value.trim();
    if (!adminSel || !edificio) return mostrarNotificacion('notificationContainer', '❌ Error', 'Complete todos los campos', 'error');
    
    const admin = admins.find(a => a.usuario === adminSel);
    const envio = {
        id: Date.now(), usuario: usuarioActivo.usuario, nombreUsuario: usuarioActivo.nombre,
        fecha: new Date().toISOString(), edificio, registros: [...docentes],
        totalRegistros: docentes.length,
        totalHoras: docentes.reduce((s, d) => s + d.asignaturas.reduce((a, b) => a + b.horas, 0), 0),
        estado: 'pendiente', adminDestino: adminSel, adminNombre: admin?.nombre
    };
    
    const enviosAdmin = JSON.parse(localStorage.getItem(`envios_${adminSel}`) || '[]');
    enviosAdmin.push(envio);
    localStorage.setItem(`envios_${adminSel}`, JSON.stringify(enviosAdmin));
    
    envios.push(envio);
    guardarDatos();
    
    actualizarEstadisticasEnvios();
    actualizarHistorialEnvios();
    mostrarNotificacion('notificationContainer', '📤 Enviado', `Tabla enviada a ${admin?.nombre}`, 'exito');
}

function actualizarEstadisticasEnvios() {
    document.getElementById('totalEnvios').textContent = envios.length;
    document.getElementById('enviosAprobados').textContent = envios.filter(e => e.estado === 'aprobado').length;
    document.getElementById('enviosPendientes').textContent = envios.filter(e => e.estado === 'pendiente').length;
    document.getElementById('enviosRechazados').textContent = envios.filter(e => e.estado === 'rechazado').length;
}

function actualizarHistorialEnvios() {
    const tbody = document.getElementById('tbodyEnviosUsuario');
    if (!envios.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Sin envíos</td></tr>';
        return;
    }
    
    tbody.innerHTML = envios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(e => {
        const est = e.estado === 'aprobado' ? 'badge-exito' : e.estado === 'rechazado' ? 'badge-peligro' : e.estado === 'reenviado' ? 'badge-info' : 'badge-advertencia';
        const txt = e.estado === 'aprobado' ? '✅ Aprobado' : e.estado === 'rechazado' ? '❌ Rechazado' : e.estado === 'reenviado' ? '📤 Reenviado' : '⏳ Pendiente';
        return `<tr>
            <td>${new Date(e.fecha).toLocaleString()}</td><td>🏛️ ${e.adminNombre || e.adminDestino}</td>
            <td>🏢 ${e.edificio}</td><td>${e.totalRegistros}</td>
            <td><span class="badge ${est}">${txt}</span></td>
            <td><button onclick="verDetallesEnvio(${e.id})" class="btn-ver">👁️ Ver</button></td>
        </tr>`;
    }).join('');
}

function verDetallesEnvio(id) {
    const envio = envios.find(e => e.id === id);
    if (!envio) return;
    
    document.getElementById('modalContenido').innerHTML = `
        <div style="margin-bottom:20px;">${Object.entries({
            Fecha: new Date(envio.fecha).toLocaleString(),
            Administrador: envio.adminNombre || envio.adminDestino,
            Edificio: envio.edificio,
            'Total registros': envio.totalRegistros,
            Estado: envio.estado,
            ...(envio.motivoRechazo && { 'Motivo rechazo': envio.motivoRechazo })
        }).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}</div>
        <h4>📋 Docentes (${envio.registros.length}):</h4>
        ${envio.registros.map((d, i) => `
            <div style="background:white; padding:15px; border-radius:var(--radio-md); margin-bottom:10px; border:1px solid var(--gris-200);">
                <p><strong>${i+1}. ${d.nombre}</strong> (${d.noEmpleado})</p>
                <p>Programa: ${d.programaEducativo || '—'} | Antigüedad: ${d.antiguedad || '—'}</p>
                <p><strong>Asignaturas (${d.asignaturas.reduce((s,a)=>s+a.horas,0)}h):</strong></p>
                <ul>${d.asignaturas.map(a => `<li>${a.nombre} - Grupo ${a.grupo} - ${a.horas}h</li>`).join('')}</ul>
            </div>
        `).join('')}
    `;
    document.getElementById('modalDetalles').style.display = 'flex';
}

function cerrarModalDetalles() { document.getElementById('modalDetalles').style.display = 'none'; }

function exportarExcel() {
    if (!docentes.length) return mostrarNotificacion('notificationContainer', '❌ Error', 'No hay datos', 'error');
    
    const csv = ['No. Empleado,Nombre,Programa,Antigüedad,Sindicato,Asignaturas,Grupos,Horas'];
    docentes.forEach(d => {
        const asig = d.asignaturas.map(a => a.nombre).join('; ');
        const grupos = d.asignaturas.map(a => a.grupo).join('; ');
        const horas = d.asignaturas.reduce((s, a) => s + a.horas, 0);
        csv.push(`"${d.noEmpleado}","${d.nombre}","${d.programaEducativo || ''}","${d.antiguedad || ''}","${d.sindicato || ''}","${asig}","${grupos}","${horas}"`);
    });
    
    const blob = new Blob(["\ufeff" + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `docentes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    mostrarNotificacion('notificationContainer', '📊 Exportado', 'Archivo generado', 'exito');
}

function actualizarTodo() { actualizarTablaDocentes(); actualizarEstadisticasEnvios(); actualizarHistorialEnvios(); }