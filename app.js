// ------------------------
// ESTADO GLOBAL
// ------------------------

const AppState = {
    reporteItems: []
};
let tempResult = null;

// ------------------------
// NAVEGACIÓN Y PESTAÑAS UI
// ------------------------

function openTab(tabId) {
    document.querySelectorAll('.section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
    });

    const activeSec = document.getElementById(tabId);
    activeSec.style.display = 'block';

    // Trigger reflow para animación CSS
    void activeSec.offsetWidth;
    activeSec.classList.add('active');

    event.currentTarget.classList.add('active');

    // Ocultar modal flotante si está abierto
    cerrarResultados();
}

function openSubTab(subId, btn) {
    document.querySelectorAll('.sub-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    document.querySelectorAll('.sub-btn').forEach(el => {
        el.classList.remove('active');
    });

    const target = document.getElementById(subId);
    target.style.display = 'block';
    void target.offsetWidth;
    target.classList.add('active');
    btn.classList.add('active');
}

// ------------------------
// PESTAÑA 1: PROYECCIONES
// ------------------------

let myChart = null;

function calcularProyeccion() {
    const t1 = parseFloat(document.getElementById('t1').value);
    const p1 = parseFloat(document.getElementById('p1').value);
    const t2 = parseFloat(document.getElementById('t2').value);
    const p2 = parseFloat(document.getElementById('p2').value);
    const tf = parseFloat(document.getElementById('ano-proyectar').value);

    // Validaciones
    if (isNaN(t1) || isNaN(p1) || isNaN(t2) || isNaN(p2) || isNaN(tf)) {
        alert("Por favor, rellene todos los campos censales con años y poblaciones válidas.");
        return;
    }
    if (t2 <= t1) { alert("El año del último censo debe ser mayor al primer censo."); return; }
    if (tf <= t2) { alert("El año a proyectar debe ser en el futuro respecto al último censo (t2)."); return; }
    if (p1 <= 0 || p2 <= 0) { alert("La población debe ser mayor a 0."); return; }

    const dt = t2 - t1;
    const dtFuturo = tf - t2;

    // Tasas "r" (Aritmética, Geométrica, Logarítmica/Exponencial)
    const rAritmetico = (p2 - p1) / dt;
    const rGeometrico = Math.pow((p2 / p1), (1 / dt)) - 1;
    const rExponencial = Math.log(p2 / p1) / dt;

    // Proyecciones Futuras (Población Pf)
    const pfAritmetico = Math.round(p2 + (rAritmetico * dtFuturo));
    const pfGeometrico = Math.round(p2 * Math.pow((1 + rGeometrico), dtFuturo));
    const pfExponencial = Math.round(p2 * Math.exp(rExponencial * dtFuturo));

    // UI Updates
    document.getElementById('res-aritmetico').textContent = formatNumber(pfAritmetico);
    document.getElementById('res-geometrico').textContent = formatNumber(pfGeometrico);
    document.getElementById('res-exponencial').textContent = formatNumber(pfExponencial);

    const seleccion = document.getElementById('metodo-proyeccion').value;
    document.getElementById('box-aritmetico').classList.remove('glow');
    document.getElementById('box-geometrico').classList.remove('glow');
    document.getElementById('box-logaritmico').classList.remove('glow');
    document.getElementById('box-' + seleccion).classList.add('glow');

    // Mostrar sección
    document.getElementById('resultados-proyeccion').style.display = 'block';

    // Gráfica
    dibujarGrafica(t1, p1, t2, p2, tf, pfAritmetico, pfGeometrico, pfExponencial, dt, dtFuturo, rAritmetico, rGeometrico, rExponencial);
}

function dibujarGrafica(t1, p1, t2, p2, tf, pfA, pfG, pfE, dt, dtFuturo, rA, rG, rE) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();

    const labels = [t1, t2];
    const dataA = [p1, p2];
    const dataG = [p1, p2];
    const dataE = [p1, p2];

    const step = Math.ceil(dtFuturo / 5) || 1;
    for (let yr = t2 + step; yr < tf; yr += step) {
        labels.push(yr);
        const yDt = yr - t2;
        dataA.push(p2 + (rA * yDt));
        dataG.push(p2 * Math.pow((1 + rG), yDt));
        dataE.push(p2 * Math.exp(rE * yDt));
    }

    if (labels[labels.length - 1] !== tf) {
        labels.push(tf);
        dataA.push(pfA);
        dataG.push(pfG);
        dataE.push(pfE);
    }

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Aritmético', data: dataA, borderColor: '#94a3b8', borderDash: [5, 5], tension: 0.1 },
                { label: 'Geométrico', data: dataG, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', fill: true, tension: 0.4 },
                { label: 'Exponencial', data: dataE, borderColor: '#8b5cf6', borderDash: [2, 2], tension: 0.4 }
            ]
        },
        options: {
            responsive: true,
            color: '#f8fafc',
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}


// ------------------------
// LÓGICAS COMUNES (GACETA)
// ------------------------

function getVal(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

function formatNumber(num) {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showResult(total, detalle, tituloResumen) {
    const resPanel = document.getElementById('resultado-panel');
    resPanel.style.display = 'block';
    void resPanel.offsetWidth;
    resPanel.classList.add('active');

    document.getElementById('res_dia').innerText = formatNumber(total) + " L/día";
    document.getElementById('res_seg').innerText = formatNumber(total / 86400) + " L/s (Qm)";
    document.getElementById('res_detalle').innerHTML = detalle;

    tempResult = {
        titulo: tituloResumen || "Cálculo Genérico",
        total: total
    };
}

function cerrarResultados() {
    document.getElementById('resultado-panel').style.display = 'none';
}

// ------------------------
// TABLAS GACETA 4044
// ------------------------

function getDotacionTabla7(area) {
    if (area <= 200) return 1500;
    if (area <= 300) return 1700;
    if (area <= 400) return 1900;
    if (area <= 500) return 2100;
    if (area <= 600) return 2200;
    if (area <= 700) return 2300;
    if (area <= 800) return 2400;
    if (area <= 900) return 2500;
    if (area <= 1000) return 2600;
    if (area <= 1200) return 2800;
    if (area <= 1400) return 3000;
    if (area <= 1700) return 3400;
    if (area <= 2000) return 3800;
    if (area <= 2500) return 4500;
    if (area <= 3000) return 5000;
    return 5000 + (Math.ceil((area - 3000) / 100) * 100);
}

function getDotacionTabla8(habs) {
    if (habs <= 1) return 500;
    if (habs === 2) return 850;
    if (habs === 3) return 1200;
    if (habs === 4) return 1350;
    if (habs === 5) return 1500;
    return 1500 + ((habs - 5) * 150);
}

// ------------------------
// CÁLCULOS PESTAÑAS
// ------------------------

function calcularMultifamiliar() {
    let total = 0;
    let detalle = "";
    let titulo = "";
    let riego = getVal('multi_jardin') * 2;

    const navExacto = document.getElementById('multi-exacto');
    if (navExacto.classList.contains('active')) {
        // MÉT. EXACTO
        let parcelas = getVal('me_parcelas') || 1;
        let area = getVal('me_area');
        let edificios = getVal('me_edificios');
        let pisos = getVal('me_pisos');
        let aptos = getVal('me_aptos');
        let habs = getVal('me_habs');

        if (edificios == 0 || pisos == 0 || aptos == 0) {
            alert("Rellene Edificios, Pisos y Aptos para el Método Exacto."); return;
        }

        let dotUnit = getDotacionTabla8(habs);
        let consumoCentral = dotUnit * aptos * pisos * edificios * parcelas;

        // Jardines Automáticos por Parcela al 10%
        let areaVerde = area * 0.10;
        let riegoParcela = areaVerde * 2;
        let riegoAutom = riegoParcela * parcelas;

        total = consumoCentral + riegoAutom + extraValue;
        titulo = `Multifamiliar Exacto - ${parcelas} parcelas de ${area} m²`;
        detalle = `
            <span style="color:var(--accent-cyan); font-weight:bold;">EDIFICACIONES:</span><br><br>
            🔹 ${formatNumber(dotUnit)} L/d x ${aptos} apto. x ${pisos} pisos x ${edificios} edificios x ${parcelas} parcelas = <span class="res-highlight" style="background-color: var(--accent-cyan); color: #000; padding: 2px 6px; border-radius: 4px;">${formatNumber(consumoCentral)} L/d</span><br>
            <hr style="border-color: rgba(255,255,255,0.1)">
            <span style="color:var(--accent-cyan); font-weight:bold;">JARDINES (10% de Parcela):</span><br><br>
            🔹 ${formatNumber(area)} m² x 0.10 = ${formatNumber(areaVerde)} m² x 2 L/d/m² = ${formatNumber(riegoParcela)} L/d<br>
            🔹 ${formatNumber(riegoParcela)} L/d x ${parcelas} parcelas = <span class="res-highlight" style="background-color: #00ff73; color: #000; padding: 2px 6px; border-radius: 4px;">${formatNumber(riegoAutom)} L/d</span>`;

        if (porcExtra > 0) {
            detalle += `<br><br>🔹 <i>*Riego Manual Adicional (Global): +${porcExtra}% = <span class="res-highlight">${formatNumber(extraValue)} L/d</span></i>`;
        }

    } else {
        // MÉT. ESTIMADO (K)
        let areaParcela = getVal('ms_area_parcela');
        let areaConst = getVal('ms_area_const');
        let cantParcelas = getVal('ms_cant_parcelas') || 1;

        if (areaParcela > 0 && areaConst > 0) {
            let porcentaje = (areaConst / areaParcela) * 100;
            let factorK = porcentaje / 10;
            let consumoUnidad = areaParcela * factorK;
            let consumoGlobal = consumoUnidad * cantParcelas;

            let riegoArea = areaParcela * (porcExtra / 100);
            let riegoUnidad = riegoArea * 2;
            let riegoGlobal = riegoUnidad * cantParcelas;

            total = consumoGlobal + riegoGlobal;

            titulo = `Multifamiliar Est. - ${cantParcelas} Parcela(s) de ${areaParcela} m²`;
            detalle = `<span style="color:var(--accent-purple); font-weight:bold;">MÉTODO ESTIMADO</span><br><br>
                1. % Construcción = (${areaConst} / ${areaParcela}) × 100 = <span class="res-highlight">${formatNumber(porcentaje)}%</span><br>
                2. Factor K = ${formatNumber(porcentaje)} / 10 = <span class="res-highlight">${formatNumber(factorK)} L/d/m²</span><br>
                3. Dotación (1) Inmueble = <span class="res-highlight">${formatNumber(consumoUnidad)} L/d</span><br>
                4. Total Inmuebles (${cantParcelas} parcelas) = <span class="res-highlight">${formatNumber(consumoGlobal)} L/d</span><br>
                <hr style="border-color: rgba(255,255,255,0.1)">
                🔹 Riego Jardines Extra (${porcExtra}% x ${cantParcelas}): <span class="res-highlight">${formatNumber(riegoGlobal)} L/d</span>`;
        } else {
            alert("Error: Área de Parcela y Construcción deben ser mayor a 0");
            return;
        }
    }
    showResult(total, detalle, titulo);
}

function calcularBifamiliar() {
    let area = getVal('bi_area');
    let habsAlta = getVal('bi_habs');
    let cantidad = getVal('bi_cantidad');

    if (area <= 0) { alert("Area de la Parcela en PB es Obligatoria"); return; }
    if (cantidad <= 0) { alert("La cantidad de bifamiliares debe ser al menos 1"); return; }

    // 1. Cálculo PB (Como Unifamiliar)
    let dotPB = getDotacionTabla7(area);
    let totalPB = dotPB * cantidad;

    // 2. Cálculo PA (Como Multifamiliar)
    let dotPA = getDotacionTabla8(habsAlta);
    let totalPA = dotPA * cantidad;

    // 3. Jardines (Porcentaje Manual)
    let porcExtra = getVal('bi_jardin') || 0;
    let areaVerde = area * (porcExtra / 100);
    let riegoParcela = areaVerde * 2;
    let totalJardin = riegoParcela * cantidad;

    let total = totalPB + totalPA + totalJardin;

    let detalle = `
        <span style="color:var(--accent-cyan); font-weight:bold;">1. PLANTA BAJA (Art.109 c.1):</span><br><br>
        🔹 Para ${formatNumber(area)} m² le corresponde ${formatNumber(dotPB)} L/d<br>
        🔹 ${cantidad} parcelas x ${formatNumber(dotPB)} L/d = <span class="res-highlight" style="background-color: var(--accent-cyan); color: #000; padding: 2px 6px; border-radius: 4px;">${formatNumber(totalPB)} L/d</span><br>
        <hr style="border-color: rgba(255,255,255,0.1)">
        <span style="color:var(--accent-cyan); font-weight:bold;">2. PLANTA ALTA (Art.109 c.2):</span><br><br>
        🔹 Para 1 Apart. de ${habsAlta} habs. le corresponde ${formatNumber(dotPA)} L/d<br>
        🔹 ${cantidad} aparts x ${formatNumber(dotPA)} L/d = <span class="res-highlight" style="background-color: var(--accent-cyan); color: #000; padding: 2px 6px; border-radius: 4px;">${formatNumber(totalPA)} L/d</span><br>
        <hr style="border-color: rgba(255,255,255,0.1)">
        <span style="color:var(--accent-cyan); font-weight:bold;">3. JARDINES (${porcExtra}% PB):</span><br><br>
        🔹 ${cantidad} parcelas de ${formatNumber(area)} m²<br>
        🔹 ${formatNumber(area)} m² x ${formatNumber(porcExtra / 100)} = ${formatNumber(areaVerde)} m² x 2 L/d/m² = ${formatNumber(riegoParcela)} L/d<br>
        🔹 ${formatNumber(riegoParcela)} L/d x ${cantidad} parcelas = <span class="res-highlight" style="background-color: #00ff73; color: #000; padding: 2px 6px; border-radius: 4px;">${formatNumber(totalJardin)} L/d</span>
    `;

    let titulo = `Bifamiliar - ${cantidad} Unidad(es)`;
    showResult(total, detalle, titulo);
}

function calcularUnifamiliar() {
    let area = getVal('uni_area');
    let cant = getVal('uni_cant') || 1;
    if (area <= 0) { alert("El área de parcela es necesaria."); return; }

    let dot = getDotacionTabla7(area);
    let total = dot * cant;
    let titulo = `Unifamiliar - ${cant} Parcela(s) de ${area} m²`;
    showResult(total, `<span style="color:var(--accent-cyan); font-weight:bold;">DESGLOSE:</span><br><br>
        🔹 Área Parcela: <span class="res-highlight">${area} m²</span><br>
        🔹 Tabla 7 Gaceta 4044: <span class="res-highlight">${formatNumber(dot)} L/d</span> por parcela<br>
        🔹 Cantidad de Parcelas (Casas): <span class="res-highlight">${cant}</span>`, titulo);
}

function calcularOtros() {
    let selectElement = document.getElementById('otros_tipo');
    let option = selectElement.options[selectElement.selectedIndex];

    let cantModulo = getVal('otros_val1');
    let cantEdificios = getVal('otros_cant') || 1;
    let areaParcela = getVal('otros_area');
    let porcExtra = getVal('otros_jardin');

    if (cantModulo <= 0) { alert("Introduzca la cantidad (número de unidades) mayor a 0."); return; }

    let dotacionUnitaria = parseFloat(option.getAttribute('data-dot')) || 0;
    let descTextoCompleta = option.text;

    let consumoUnidad = cantModulo * dotacionUnitaria;
    let desc = `${descTextoCompleta} × ${cantModulo}`;

    let consumoTotalEdificios = consumoUnidad * cantEdificios;

    // Riego modificado a Porcentaje x Area Parcela x 2 L/d x Cantidad de Inmuebles (opcional si son separados, pero tomaremos area global)
    let riego = 0;
    if (areaParcela > 0 && porcExtra > 0) {
        let areaRegar = areaParcela * (porcExtra / 100);
        riego = (areaRegar * 2) * cantEdificios;
    }

    let total = consumoTotalEdificios + riego;

    let descTipo = descTextoCompleta.split('(')[0].trim();
    let unit = option.getAttribute('data-unit') || 'Unds.';
    let titulo = `${descTipo} - ${formatNumber(cantModulo)} ${unit} x ${cantEdificios} Edificios`;

    showResult(total, `<span style="color:var(--accent-cyan); font-weight:bold;">DESTINO:</span><br><br>
        🔹 Cálculo Base: <span class="res-highlight">${desc} = ${formatNumber(consumoUnidad)} L/d</span><br>
        🔹 Cantidad Inmuebles: <span class="res-highlight">${cantEdificios}</span><br>
        🔹 Sub-total (Sin riego): <span class="res-highlight">${formatNumber(consumoTotalEdificios)} L/d</span><br>
        <hr style="border-color: rgba(255,255,255,0.1)">
        🔹 Riego Jardines (${porcExtra}%): <span class="res-highlight">${formatNumber(riego)} L/d</span>`, titulo);
}

// ------------------------
// CÁLCULO PER CÁPITA
// ------------------------

document.addEventListener('DOMContentLoaded', () => {
    const btnAutoNorma = document.getElementById('btn-auto-norma');
    if (btnAutoNorma) {
        btnAutoNorma.addEventListener('click', (e) => {
            e.preventDefault();
            const pob = parseFloat(document.getElementById('poblacion-base').value) || 0;
            if (pob <= 0) {
                alert("Primero defina una población base válida (mayor a 0).");
                return;
            }
            let dot = 200;
            if (pob > 20000 && pob <= 50000) dot = 250;
            else if (pob > 50000 && pob <= 100000) dot = 300;
            else if (pob > 100000) dot = 350;

            document.getElementById('dotacion-per-capita').value = dot;
        });
    }

    const selectOtros = document.getElementById('otros_tipo');
    if (selectOtros) {
        selectOtros.addEventListener('change', actualizarLabelOtros);
        actualizarLabelOtros(); // initial set
    }
});

function actualizarLabelOtros() {
    const sel = document.getElementById('otros_tipo');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    const unit = opt.getAttribute('data-unit') || 'Cantidad';
    const labelEl = document.getElementById('label_otros_val1');
    if (labelEl) labelEl.innerText = `Unidades (${unit}):`;
}

function calcularPerCapita() {
    const pob = getVal('poblacion-base');
    const dot = getVal('dotacion-per-capita');

    if (pob <= 0 || dot <= 0) {
        alert("Ingrese la población y la dotación mayores a 0.");
        return;
    }

    const total = pob * dot;
    showResult(total, `<span style="color:var(--accent-cyan); font-weight:bold;">MÉTODO PER CÁPITA:</span><br><br>
        🔹 Población: <span class="res-highlight">${formatNumber(pob)} hab</span><br>
        🔹 Dotación: <span class="res-highlight">${formatNumber(dot)} L/hab/d</span><br>
        <hr style="border-color: rgba(255,255,255,0.1)">
        🔹 Total Demanda: <span class="res-highlight">${formatNumber(total)} L/d</span>`, `Método Per Cápita (${formatNumber(pob)} hab)`);
}

// ------------------------
// LÓGICA DE REPORTE Y TOTALIZADOR
// ------------------------

function agregarAlReporte() {
    if (tempResult) {
        AppState.reporteItems.push({ ...tempResult });
        actualizarTablaReporte();
        cerrarResultados();

        // Efecto visual flash
        const reporteTab = document.querySelector('.nav-item[onclick="openTab(\\\'reporte\\\')"]');
        if (reporteTab) {
            reporteTab.style.background = "var(--success)";
            reporteTab.style.color = "white";
            setTimeout(() => {
                reporteTab.style.background = "";
                reporteTab.style.color = "";
            }, 600);
        }
    }
}

function actualizarTablaReporte() {
    const tbody = document.getElementById('tabla-reporte');
    tbody.innerHTML = '';
    let granTotal = 0;

    if (AppState.reporteItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-secondary);">Aún no hay cálculos agregados al reporte. Utiliza las otras pestañas para calcular y agregar demandadas.</td></tr>`;
        document.getElementById('gran-total-ld').innerText = "0.00";
        document.getElementById('gran-total-ls').innerText = "0.00";
        return;
    }

    AppState.reporteItems.forEach((item, index) => {
        granTotal += item.total;
        const caudalLs = item.total / 86400;

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        tr.innerHTML = `
            <td style="padding: 12px 10px;">${item.titulo}</td>
            <td style="padding: 12px 10px; text-align: right; color: white; font-weight: 600;">${formatNumber(item.total)}</td>
            <td style="padding: 12px 10px; text-align: right; color: white;">${formatNumber(caudalLs)}</td>
            <td style="padding: 12px 10px; text-align: center;">
                <button onclick="eliminarDelReporte(${index})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; border-radius: 4px; padding: 4px 10px; cursor: pointer;">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('gran-total-ld').innerText = formatNumber(granTotal);
    document.getElementById('gran-total-ls').innerText = formatNumber(granTotal / 86400);
}

function eliminarDelReporte(index) {
    AppState.reporteItems.splice(index, 1);
    actualizarTablaReporte();
}

function limpiarReporte() {
    if (confirm("¿Estás seguro de limpiar toda la data del reporte actual?")) {
        AppState.reporteItems = [];
        actualizarTablaReporte();
    }
}

function imprimirReporte() {
    if (AppState.reporteItems.length === 0) {
        alert("El reporte está vacío.");
        return;
    }
    openTab('reporte');
    setTimeout(() => {
        window.print();
    }, 500);
}
