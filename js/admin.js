let envios = [], usuarioActivo = null, envioSeleccionado = null, intervaloActualizacion = null;

window.onload = function() {
    usuarioActivo = verificarSesion(['admin']);
    if (!usuarioActivo) return;
    
    document.getElementById('adminNombre').textContent = usuarioActivo.nombre;
    document.getElementById('adminCargo').textContent = usuarioActivo.cargo || 'Administrador';
    document.getElementById('welcomeMessage').innerHTML = `📋 Bienvenido, ${usuarioActivo.nombre}`;
    
    cargarDatos();
    actualizarTodo();
    intervaloActualizacion = setInterval(() => { cargarDatos(); actualizarTodo(); }, 3000);
    mostrarNotificacion('notificationContainer', '✅ Conectado', 'Sistema activado', 'exito');
};

function cargarDatos() { envios = JSON.parse(localStorage.getItem(`envios_${usuarioActivo.usuario}`) || '[]'); }
function guardarDatos() { localStorage.setItem(`envios_${usuarioActivo.usuario}`, JSON.stringify(envios)); }

function filtrarEnvios(f) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
    document.getElementById(`tab${f.charAt(0).toUpperCase() + f.slice(1)}`).classList.add('activo');
    mostrarTabla(f === 'todos' ? envios : envios.filter(e => e.estado === f));
}

function mostrarTabla(lista) {
    const tbody = document.getElementById('tbodyEnvios');
    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:48px;">📤 No hay envíos</td></tr>';
        return;
    }
    
    tbody.innerHTML = lista.sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).map(e => {
        const est = e.estado === 'aprobado' ? 'badge-exito' : e.estado === 'rechazado' ? 'badge-peligro' : e.estado === 'reenviado' ? 'badge-info' : 'badge-advertencia';
        const txt = e.estado === 'aprobado' ? '✅ Aprobado' : e.estado === 'rechazado' ? '❌ Rechazado' : e.estado === 'reenviado' ? '📤 Reenviado' : '⏳ Pendiente';
        return `<tr data-id="${e.id}">
            <td>#${e.id}</td><td>${new Date(e.fecha).toLocaleString()}</td><td>👤 ${e.nombreUsuario || e.usuario}</td>
            <td>🏢 ${e.edificio}</td><td>${e.registros?.length || 0}</td><td>${e.totalHoras || 0}</td>
            <td><span class="badge ${est}">${txt}</span></td>
            <td>
                <button onclick="verDetallesEnvio(${e.id})" class="btn-ver">👁️</button>
                ${e.estado === 'pendiente' ? `
                    <button onclick="aprobarEnvio(${e.id})" class="btn-aprobar">✅</button>
                    <button onclick="mostrarModalRechazo(${e.id})" class="btn-rechazar">❌</button>
                ` : ''}
                ${e.estado === 'aprobado' ? `
                    <button onclick="mostrarModalReenviar(${e.id})" class="btn-primario btn-sm">📤 Super</button>
                ` : ''}
            </td>
        </tr>`;
    }).join('');
}

function aprobarEnvio(id) {
    const e = envios.find(e => e.id === id);
    if (!e) return;
    e.estado = 'aprobado'; e.fechaAprobacion = new Date().toISOString(); e.aprobadoPor = usuarioActivo.nombre;
    guardarDatos(); actualizarTodo();
    mostrarNotificacion('notificationContainer', '✅ Aprobado', `Envío #${id} aprobado`, 'exito');
}

function mostrarModalRechazo(id) { envioSeleccionado = id; document.getElementById('modalRechazo').style.display = 'flex'; }
function cerrarModal() { document.getElementById('modalRechazo').style.display = 'none'; document.getElementById('motivoRechazo').value = ''; envioSeleccionado = null; }

function confirmarRechazo() {
    const motivo = document.getElementById('motivoRechazo').value.trim();
    if (!motivo) return mostrarNotificacion('notificationContainer', '❌ Error', 'Indique motivo', 'error');
    
    const e = envios.find(e => e.id === envioSeleccionado);
    if (!e) return;
    
    e.estado = 'rechazado'; e.fechaRechazo = new Date().toISOString(); e.motivoRechazo = motivo; e.rechazadoPor = usuarioActivo.nombre;
    guardarDatos(); cerrarModal(); actualizarTodo();
    mostrarNotificacion('notificationContainer', '❌ Rechazado', `Envío #${envioSeleccionado} rechazado`, 'advertencia');
}

function mostrarModalReenviar(id) {
    const e = envios.find(e => e.id === id);
    if (!e || e.estado !== 'aprobado') return mostrarNotificacion('notificationContainer', '❌ Error', 'Solo envíos aprobados', 'error');
    envioSeleccionado = id; document.getElementById('modalReenviar').style.display = 'flex';
}

function cerrarModalReenviar() { document.getElementById('modalReenviar').style.display = 'none'; document.getElementById('notaReenvio').value = ''; envioSeleccionado = null; }

function confirmarReenvio() {
    const e = envios.find(e => e.id === envioSeleccionado);
    if (!e) return;
    
    const nota = document.getElementById('notaReenvio').value.trim();
    e.estado = 'reenviado'; e.fechaReenvio = new Date().toISOString(); e.reenviadoPor = usuarioActivo.nombre; e.notaReenvio = nota;
    guardarDatos();
    
    const envioSuper = { ...e, id: Date.now(), originalId: envioSeleccionado, adminOrigen: usuarioActivo.usuario, adminNombre: usuarioActivo.nombre, fechaReenvio: new Date().toISOString(), estado: 'recibido' };
    const supers = JSON.parse(localStorage.getItem('envios_super') || '[]');
    supers.push(envioSuper);
    localStorage.setItem('envios_super', JSON.stringify(supers));
    
    cerrarModalReenviar(); actualizarTodo();
    mostrarNotificacion('notificationContainer', '📤 Reenviado', `Envío #${envioSeleccionado} reenviado a Super`, 'exito');
}

function verDetallesEnvio(id) {
    const e = envios.find(e => e.id === id);
    if (!e) return;
    
    document.getElementById('modalContenido').innerHTML = `
        <div style="margin-bottom:20px;">${Object.entries({
            Fecha: new Date(e.fecha).toLocaleString(),
            Usuario: e.nombreUsuario || e.usuario,
            Edificio: e.edificio,
            'Total registros': e.totalRegistros,
            Estado: e.estado,
            ...(e.motivoRechazo && { 'Motivo rechazo': e.motivoRechazo }),
            ...(e.notaReenvio && { 'Nota reenvío': e.notaReenvio })
        }).map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}</div>
        <h4>📋 Docentes (${e.registros.length}):</h4>
        ${e.registros.map((d,i) => `
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

function actualizarEstadisticas() {
    document.getElementById('totalPendientes').textContent = envios.filter(e => e.estado === 'pendiente').length;
    document.getElementById('totalAprobados').textContent = envios.filter(e => e.estado === 'aprobado').length;
    document.getElementById('totalRechazados').textContent = envios.filter(e => e.estado === 'rechazado').length;
    document.getElementById('totalReenviados').textContent = envios.filter(e => e.estado === 'reenviado').length;
    document.getElementById('totalEnvios').textContent = envios.length;
}

function actualizarTodo() { mostrarTabla(envios); actualizarEstadisticas(); }