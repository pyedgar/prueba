let admins = [], usuarios = [], enviosUsuarios = [], enviosAdmins = [], intervaloActualizacion = null;

window.onload = function() {
    if (!verificarSesion(['super'])) return;
    document.getElementById('superAdminNombre').textContent = JSON.parse(sessionStorage.getItem('usuario_activo')).nombre;
    cargarDatos();
    actualizarTodo();
    intervaloActualizacion = setInterval(() => { cargarDatos(); actualizarTodo(); }, 3000);
    mostrarNotificacion('notificationContainer', '👑 Bienvenida', 'Panel de control activado', 'exito');
};

function cargarDatos() {
    admins = JSON.parse(localStorage.getItem('administradores') || '[]');
    usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    
    enviosUsuarios = [];
    usuarios.forEach(u => enviosUsuarios.push(...JSON.parse(localStorage.getItem(`envios_${u.usuario}`) || '[]')));
    
    enviosAdmins = JSON.parse(localStorage.getItem('envios_super') || '[]');
}

function toggleFormulario(tipo) {
    const formId = `formNuevo${tipo === 'admin' ? 'Admin' : 'Usuario'}`;
    const form = document.getElementById(formId);
    const btn = document.getElementById(`btnNuevo${tipo === 'admin' ? 'Admin' : 'Usuario'}`);
    
    if (form.style.display === 'none' || form.style.display === '') {
        form.style.display = 'block';
        btn.style.display = 'none';
        // Scroll suave al formulario
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        form.style.display = 'none';
        btn.style.display = 'inline-flex';
    }
}

function limpiarFormulario(tipo) {
    const prefix = tipo === 'admin' ? 'nuevoAdmin' : 'nuevoUsuario';
    ['Nombre', 'Usuario', 'Password', 'Cargo'].forEach(campo => {
        document.getElementById(prefix + campo).value = '';
    });
}

function validarPassword(password) {
    return password.length >= 6;
}

function registrarAdministrador() {
    const nombre = document.getElementById('nuevoAdminNombre').value.trim();
    const usuario = document.getElementById('nuevoAdminUsuario').value.trim().toLowerCase();
    const password = document.getElementById('nuevoAdminPassword').value.trim();
    const cargo = document.getElementById('nuevoAdminCargo').value.trim() || 'Administrador';
    
    if (!nombre || !usuario || !password) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'Nombre, usuario y contraseña son obligatorios', 'error');
        return;
    }
    
    if (!validarPassword(password)) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (admins.some(a => a.usuario === usuario)) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'El nombre de usuario ya existe', 'error');
        return;
    }
    
    const nuevoAdmin = {
        id: Date.now(),
        nombre: nombre,
        usuario: usuario,
        password: password,
        cargo: cargo,
        rol: 'admin',
        activo: true,
        fechaRegistro: new Date().toISOString()
    };
    
    admins.push(nuevoAdmin);
    localStorage.setItem('administradores', JSON.stringify(admins));
    localStorage.setItem(`envios_${usuario}`, JSON.stringify([]));
    
    toggleFormulario('admin');
    limpiarFormulario('admin');
    actualizarTablaAdmins();
    
    mostrarNotificacion('notificationContainer', '✅ Administrador Registrado', 
        `${nombre} ha sido agregado como administrador`, 'exito');
}

function registrarUsuario() {
    const nombre = document.getElementById('nuevoUsuarioNombre').value.trim();
    const usuario = document.getElementById('nuevoUsuarioUsuario').value.trim().toLowerCase();
    const password = document.getElementById('nuevoUsuarioPassword').value.trim();
    const cargo = document.getElementById('nuevoUsuarioCargo').value.trim() || 'Usuario';
    
    if (!nombre || !usuario || !password) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'Nombre, usuario y contraseña son obligatorios', 'error');
        return;
    }
    
    if (!validarPassword(password)) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (usuarios.some(u => u.usuario === usuario)) {
        mostrarNotificacion('notificationContainer', '❌ Error', 'El nombre de usuario ya existe', 'error');
        return;
    }
    
    const nuevoUsuario = {
        id: Date.now(),
        nombre: nombre,
        usuario: usuario,
        password: password,
        cargo: cargo,
        activo: true,
        fechaRegistro: new Date().toISOString()
    };
    
    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    localStorage.setItem(`docentes_${usuario}`, JSON.stringify([]));
    localStorage.setItem(`envios_${usuario}`, JSON.stringify([]));
    
    toggleFormulario('usuario');
    limpiarFormulario('usuario');
    actualizarTablaUsuarios();
    
    mostrarNotificacion('notificationContainer', '✅ Usuario Registrado', 
        `${nombre} ha sido agregado como usuario`, 'exito');
}

function toggleAdminStatus(id) {
    const admin = admins.find(a => a.id == id);
    if (admin) {
        admin.activo = !admin.activo;
        localStorage.setItem('administradores', JSON.stringify(admins));
        actualizarTablaAdmins();
        mostrarNotificacion('notificationContainer', 
            admin.activo ? '✅ Administrador Activado' : '⚠️ Administrador Desactivado',
            `${admin.nombre} ha sido ${admin.activo ? 'activado' : 'desactivado'}`, 'info');
    }
}

function toggleUsuarioStatus(id) {
    const usuario = usuarios.find(u => u.id == id);
    if (usuario) {
        usuario.activo = !usuario.activo;
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        actualizarTablaUsuarios();
        mostrarNotificacion('notificationContainer', 
            usuario.activo ? '✅ Usuario Activado' : '⚠️ Usuario Desactivado',
            `${usuario.nombre} ha sido ${usuario.activo ? 'activado' : 'desactivado'}`, 'info');
    }
}

function eliminarAdmin(id) {
    const admin = admins.find(a => a.id == id);
    if (!admin) return;
    
    if (admin.usuario === 'laura.sandino') {
        mostrarNotificacion('notificationContainer', '❌ Acción no permitida', 
            'No puedes eliminar al Super Admin principal', 'error');
        return;
    }
    
    if (confirm(`¿Estás seguro de eliminar a ${admin.nombre}?`)) {
        admins = admins.filter(a => a.id != id);
        localStorage.setItem('administradores', JSON.stringify(admins));
        localStorage.removeItem(`envios_${admin.usuario}`);
        actualizarTablaAdmins();
        mostrarNotificacion('notificationContainer', '🗑️ Administrador Eliminado', 
            `${admin.nombre} ha sido eliminado`, 'advertencia');
    }
}

function eliminarUsuario(id) {
    const usuario = usuarios.find(u => u.id == id);
    if (!usuario) return;
    
    if (confirm(`¿Estás seguro de eliminar a ${usuario.nombre}?`)) {
        usuarios = usuarios.filter(u => u.id != id);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        localStorage.removeItem(`docentes_${usuario.usuario}`);
        localStorage.removeItem(`envios_${usuario.usuario}`);
        actualizarTablaUsuarios();
        mostrarNotificacion('notificationContainer', '🗑️ Usuario Eliminado', 
            `${usuario.nombre} ha sido eliminado`, 'advertencia');
    }
}

function actualizarTablaAdmins() {
    const tbody = document.getElementById('tbodyAdministradores');
    if (!tbody) return;
    
    const adminsActivos = admins.filter(a => a.rol === 'admin');
    
    if (adminsActivos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px;">
            <div style="font-size:48px; margin-bottom:16px;">👥</div>
            <div style="font-size:18px; font-weight:600;">No hay administradores</div>
            <div style="font-size:14px; color:var(--gris-500); margin-top:8px;">
                Usa el botón "Nuevo Administrador" para comenzar
            </div>
        </td></tr>`;
        document.getElementById('totalAdmins').textContent = 0;
        return;
    }
    
    let html = '';
    adminsActivos.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)).forEach((admin, i) => {
        const recibidos = enviosUsuarios.filter(e => e.adminDestino === admin.usuario).length;
        const enviados = enviosAdmins.filter(e => e.adminOrigen === admin.usuario).length;
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${admin.nombre}</strong></td>
            <td><code style="background:var(--gris-100); padding:4px 8px; border-radius:6px;">${admin.usuario}</code></td>
            <td>${admin.cargo || '—'}</td>
            <td>
                <span class="badge ${admin.activo ? 'badge-exito' : 'badge-peligro'}">
                    ${admin.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
            </td>
            <td>📥 ${recibidos} / 📤 ${enviados}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button onclick="toggleAdminStatus(${admin.id})" class="btn btn-sm" 
                            style="background:${admin.activo ? '#f59e0b20' : '#10b98120'}; color:${admin.activo ? '#92400e' : '#065f46'};">
                        ${admin.activo ? '⚠️' : '✅'}
                    </button>
                    <button onclick="eliminarAdmin(${admin.id})" class="btn-eliminar btn-sm">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    document.getElementById('totalAdmins').textContent = adminsActivos.length;
}

function actualizarTablaUsuarios() {
    const tbody = document.getElementById('tbodyUsuarios');
    if (!tbody) return;
    
    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px;">
            <div style="font-size:48px; margin-bottom:16px;">👤</div>
            <div style="font-size:18px; font-weight:600;">No hay usuarios</div>
            <div style="font-size:14px; color:var(--gris-500); margin-top:8px;">
                Usa el botón "Nuevo Usuario" para comenzar
            </div>
        </td></tr>`;
        document.getElementById('totalUsuarios').textContent = 0;
        return;
    }
    
    let html = '';
    usuarios.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)).forEach((usuario, i) => {
        const envios = enviosUsuarios.filter(e => e.usuario === usuario.usuario).length;
        
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${usuario.nombre}</strong></td>
            <td><code style="background:var(--gris-100); padding:4px 8px; border-radius:6px;">${usuario.usuario}</code></td>
            <td>${usuario.cargo || '—'}</td>
            <td>
                <span class="badge ${usuario.activo ? 'badge-exito' : 'badge-peligro'}">
                    ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
            </td>
            <td>📤 ${envios}</td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button onclick="toggleUsuarioStatus(${usuario.id})" class="btn btn-sm"
                            style="background:${usuario.activo ? '#f59e0b20' : '#10b98120'}; color:${usuario.activo ? '#92400e' : '#065f46'};">
                        ${usuario.activo ? '⚠️' : '✅'}
                    </button>
                    <button onclick="eliminarUsuario(${usuario.id})" class="btn-eliminar btn-sm">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    document.getElementById('totalUsuarios').textContent = usuarios.length;
}

function actualizarEnviosUsuarios() {
    const tbody = document.getElementById('tbodyEnviosUsuarios');
    if (!tbody) return;
    
    if (enviosUsuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px;">
            <div style="font-size:48px; margin-bottom:16px;">📤</div>
            <div style="font-size:18px; font-weight:600;">No hay envíos de usuarios</div>
        </td></tr>`;
        document.getElementById('totalEnviosUsuarios').textContent = 0;
        return;
    }
    
    let html = '';
    enviosUsuarios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(envio => {
        const admin = admins.find(a => a.usuario === envio.adminDestino);
        const estadoClass = envio.estado === 'aprobado' ? 'badge-exito' : 
                           envio.estado === 'rechazado' ? 'badge-peligro' : 
                           envio.estado === 'reenviado' ? 'badge-info' : 'badge-advertencia';
        
        html += `<tr>
            <td>${new Date(envio.fecha).toLocaleString()}</td>
            <td>👤 ${envio.nombreUsuario || envio.usuario}</td>
            <td>🏛️ ${admin?.nombre || envio.adminDestino}</td>
            <td>🏢 ${envio.edificio}</td>
            <td>${envio.totalRegistros} docentes</td>
            <td><span class="badge ${estadoClass}">${envio.estado}</span></td>
            <td>
                <button onclick="verDetalles('usuario', ${envio.id})" class="btn-ver">
                    👁️ Ver
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    document.getElementById('totalEnviosUsuarios').textContent = enviosUsuarios.length;
}

function actualizarEnviosAdmins() {
    const tbody = document.getElementById('tbodyEnviosAdmins');
    if (!tbody) return;
    
    if (enviosAdmins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px;">
            <div style="font-size:48px; margin-bottom:16px;">📤</div>
            <div style="font-size:18px; font-weight:600;">No hay envíos de administradores</div>
        </td></tr>`;
        document.getElementById('totalEnviosAdmins').textContent = 0;
        return;
    }
    
    let html = '';
    enviosAdmins.sort((a, b) => new Date(b.fechaReenvio || b.fecha) - new Date(a.fechaReenvio || a.fecha)).forEach(envio => {
        const admin = admins.find(a => a.usuario === envio.adminOrigen);
        
        html += `<tr>
            <td>${new Date(envio.fechaReenvio || envio.fecha).toLocaleString()}</td>
            <td>🏛️ ${admin?.nombre || envio.adminOrigen}</td>
            <td>👤 ${envio.nombreUsuario || envio.usuario}</td>
            <td>🏢 ${envio.edificio}</td>
            <td>${envio.totalRegistros} docentes</td>
            <td>${envio.notaReenvio || '—'}</td>
            <td>
                <button onclick="verDetalles('admin', ${envio.id})" class="btn-ver">
                    👁️ Ver
                </button>
            </td>
        </tr>`;
    });
    
    tbody.innerHTML = html;
    document.getElementById('totalEnviosAdmins').textContent = enviosAdmins.length;
}

function verDetalles(tipo, id) {
    const envio = tipo === 'usuario' ? enviosUsuarios.find(e => e.id === id) : enviosAdmins.find(e => e.id === id);
    if (!envio) return;
    
    const contenido = document.getElementById('modalContenido');
    document.getElementById('modalTitulo').textContent = `📋 Detalles del Envío #${id}`;
    
    let html = '<div style="margin-bottom:20px;">';
    
    // Información general
    const campos = {
        'Fecha': new Date(envio.fecha).toLocaleString(),
        'Usuario': envio.nombreUsuario || envio.usuario,
        'Edificio': envio.edificio,
        'Total registros': envio.totalRegistros,
        'Total horas': envio.totalHoras,
        'Estado': envio.estado
    };
    
    if (envio.adminDestino) campos['Admin destino'] = envio.adminDestino;
    if (envio.adminOrigen) campos['Admin origen'] = envio.adminOrigen;
    if (envio.motivoRechazo) campos['Motivo rechazo'] = envio.motivoRechazo;
    if (envio.notaReenvio) campos['Nota reenvío'] = envio.notaReenvio;
    
    Object.entries(campos).forEach(([k, v]) => {
        html += `<p><strong>${k}:</strong> ${v}</p>`;
    });
    
    html += '</div><h4 style="margin:20px 0 10px;">📋 Docentes registrados:</h4>';
    
    if (envio.registros && envio.registros.length > 0) {
        envio.registros.forEach((doc, i) => {
            const totalHorasDoc = doc.asignaturas.reduce((s, a) => s + a.horas, 0);
            html += `
                <div style="background:white; padding:15px; border-radius:var(--radio-md); margin-bottom:10px; border:1px solid var(--gris-200);">
                    <p><strong>${i+1}. ${doc.nombre}</strong> (${doc.noEmpleado})</p>
                    <p>Programa: ${doc.programaEducativo || '—'} | Antigüedad: ${doc.antiguedad || '—'} | Sindicato: ${doc.sindicato || '—'}</p>
                    <p><strong>Asignaturas (Total horas: ${totalHorasDoc}):</strong></p>
                    <ul style="margin-left:20px;">
                        ${doc.asignaturas.map(a => `<li>${a.nombre} - Grupo ${a.grupo} - ${a.horas} horas</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    } else {
        html += '<p>No hay docentes registrados</p>';
    }
    
    contenido.innerHTML = html;
    document.getElementById('modalDetalles').style.display = 'flex';
}

function cerrarModalDetalles() {
    document.getElementById('modalDetalles').style.display = 'none';
}

function cambiarSeccion(seccion) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('activo'));
    document.getElementById(`tab${seccion.charAt(0).toUpperCase() + seccion.slice(1)}`).classList.add('activo');
    
    const secciones = ['admins', 'usuarios', 'enviosUsuarios', 'enviosAdmins'];
    secciones.forEach(s => {
        document.getElementById(`seccion${s.charAt(0).toUpperCase() + s.slice(1)}`).style.display = s === seccion ? 'block' : 'none';
    });
}

function actualizarTodo() {
    actualizarTablaAdmins();
    actualizarTablaUsuarios();
    actualizarEnviosUsuarios();
    actualizarEnviosAdmins();
}