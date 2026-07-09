/* ================================================================
   Mapa Turístico — Santa Rosa de Calamuchita
   ================================================================
   Para agregar puntos de interés editá el array PUNTOS_DE_INTERES.
   Para agregar zonas clicables editá el array ZONAS_CLICABLES.
   Las coordenadas son [x, y] en píxeles desde la esquina
   superior izquierda de la imagen 'assets/mapa-src.png'.
   ================================================================ */

/* ----------------------------------------------------------------
   CONFIGURACIÓN
   ---------------------------------------------------------------- */
var CONFIG = {
    imagePath: 'assets/mapa-src.png',
    zoomMax: 5,
    zoomMin: null,
    panMargin: 500,
};

/* ----------------------------------------------------------------
   PUNTOS DE INTERÉS
   ----------------------------------------------------------------
   Formato: { x, y, nombre, desc, emoji, categoria }
   x = píxeles desde el borde izquierdo
   y = píxeles desde el borde superior
   ---------------------------------------------------------------- */
var PUNTOS_DE_INTERES = [
    {
        x: 3066, y: 3908,
        nombre: 'Plaza de la Familia',
        desc: 'Es un nuevo y moderno espacio público ubicado junto al río en el tradicional sector del Balneario Santa Rita. Es una excelente opción para el disfrute de grandes y chicos',
        emoji: '\u{1F333}',
        categoria: 'plaza',
    },
    {
        x: 3268, y: 3328,
        nombre: 'Parroquia Santa Rosa de Lima',
        desc: ' Ubicada sobre la calle Libertad, es el principal centro de culto católico de la ciudad dependiente de la Arquidiócesis de Córdoba. Ofrece misas regulares los martes a viernes a las 20:00 y los domingos a las 11:00 y 20:00.',
        emoji: '\u26EA',
        categoria: 'cultura',
    },
    {
        x: 3037, y: 2684,
        nombre: 'Balneario Playa Soleada',
        desc: 'El mejor lugar para refrescarse en el río. Con asadores y proveeduría. Ideal para pasar el día en familia.',
        emoji: '\u{1F3CA}',
        categoria: 'naturaleza',
    },
    {
        x: 3008, y: 3118,
        nombre: 'Costanera',
        desc: 'Paseo hermoso a la orilla del río. Perfecto para caminar, andar en bici o matear al atardecer.',
        emoji: '\u{1F305}',
        categoria: 'naturaleza',
    },
    {
        x: 3390, y: 2660,
        nombre: 'Terminal de Ómnibus',
        desc: 'Llegadas y salidas a toda la región. Bien conectada con Córdoba Capital y las sierras.',
        emoji: '\u{1F68C}',
        categoria: 'servicios',
    },
    {
        x: 3317, y: 3334,
        nombre: 'Museo Estanislao Baños',
        desc: 'Nuestro museo expone una interesante visión de la historia del sitio a través de fotografías, mapas y piezas prehispánicas.',
        emoji: '\u{1F3DB}\uFE0F',
        categoria: 'cultura',
    },
    {
        x: 3313, y: 3158,
        nombre: 'Mirador del Valle',
        desc: 'Vista panorámica espectacular de todo el valle de Calamuchita. No te olvides la cámara.',
        emoji: '🔭',
        categoria: 'mirador',
    },
    {
        x: 2280, y: 1745,
        nombre: 'Calicanto Jesuita',
        desc: 'El Calicanto Jesuita fue construido por los jesuitas durante su estancia en la región, entre los siglos XVII y XVIII. Servían como sistemas de riego y canales de agua para las estancias y tierras cultivadas por la orden.',
        emoji: '🪨',
        categoria: 'cultura',
    },
];

/* ----------------------------------------------------------------
   ZONAS CLICABLES
   ----------------------------------------------------------------
   Formato: { vertices: [[x1,y1], [x2,y2], ...], nombre, desc, color }
   ---------------------------------------------------------------- */
var ZONAS_CLICABLES = [
    {
        vertices: [
            [3208, 3494],
            [3121, 3442],
            [3113, 3369],
            [2897, 2992],
            [3003, 2800],
            [3282, 2771],
            [3261, 3428],
        ],
        nombre: 'Centro',
        desc: 'Zona céntrica de nuestra ciudad.',
        color: '#ffa1f1ff',
    },
];

/* ----------------------------------------------------------------
   INICIALIZACIÓN
   ---------------------------------------------------------------- */
(function () {
    var loadingEl = document.getElementById('loading');
    var mapEl = document.getElementById('map');
    var coordsEl = document.getElementById('coords');
    var sidebarToggle = document.getElementById('sidebar-toggle');
    var sidebarClose = document.getElementById('sidebar-close');
    var sidebar = document.getElementById('sidebar');
    var map;

    var img = new Image();

    img.onload = function () {
        var W = img.naturalWidth;
        var H = img.naturalHeight;

        if (!W || !H) {
            mostrarError('La imagen no tiene dimensiones válidas.');
            return;
        }

        var bounds = [[0, 0], [H, W]];
        var m = CONFIG.panMargin;
        var panBounds = [[-m, -m], [H + m, W + m]];

        map = L.map('map', {
            crs: L.CRS.Simple,
            maxBounds: panBounds,
            maxBoundsViscosity: 1.0,
            zoomControl: true,
            attributionControl: false,
        });

        L.imageOverlay(CONFIG.imagePath, bounds).addTo(map);

        var zonaCentro = ZONAS_CLICABLES[0];
        var xs = zonaCentro.vertices.map(function (v) { return v[0]; });
        var ys = zonaCentro.vertices.map(function (v) { return v[1]; });
        var zoneBounds = [
            [Math.min.apply(null, ys), Math.min.apply(null, xs)],
            [Math.max.apply(null, ys), Math.max.apply(null, xs)]
        ];

        map.fitBounds(zoneBounds, { padding: [30, 30], animate: false });

        map.setMinZoom(map.getZoom() - 2);
        map.setMaxZoom(CONFIG.zoomMax);

        var markers = agregarMarcadores(map);
        var zonas = agregarZonas(map);
        construirSidebar(map, markers, sidebar, sidebarToggle);

        if (zonas.length > 0) {
            zonas[0].openPopup();
        }

        map.on('mousemove', function (e) {
            var x = Math.round(e.latlng.lng);
            var y = Math.round(e.latlng.lat);
            coordsEl.textContent = 'x: ' + x + '  y: ' + y;
        });

        loadingEl.style.display = 'none';

        map.invalidateSize();
    };

    img.onerror = function () {
        mostrarError(
            'No se pudo cargar la imagen del mapa.<br>' +
            'Asegurate de que exista el archivo <code>' +
            CONFIG.imagePath + '</code>.'
        );
    };

    img.src = CONFIG.imagePath;

    /* ------------------------------------------------
       Sidebar: abrir / cerrar
       ------------------------------------------------ */
    sidebarToggle.addEventListener('click', function () {
        sidebar.classList.add('sidebar--abierta');
        sidebarToggle.classList.add('sidebar-toggle--oculto');
        document.body.classList.add('mapa-con-sidebar');
        requestAnimationFrame(function () { map.invalidateSize(); });
    });

    sidebarClose.addEventListener('click', function () {
        sidebar.classList.remove('sidebar--abierta');
        sidebarToggle.classList.remove('sidebar-toggle--oculto');
        document.body.classList.remove('mapa-con-sidebar');
        requestAnimationFrame(function () { map.invalidateSize(); });
    });

    /* ------------------------------------------------
       Error helper
       ------------------------------------------------ */
    function mostrarError(mensaje) {
        loadingEl.innerHTML =
            '<div class="loading-error">' +
            '<span class="error-icon">\u274C</span>' +
            '<p>' + mensaje + '</p>' +
            '</div>';
    }
})();

/* ----------------------------------------------------------------
   MARCADORES
   ---------------------------------------------------------------- */
function agregarMarcadores(map) {
    var markers = [];

    PUNTOS_DE_INTERES.forEach(function (punto, index) {
        var icono = L.divIcon({
            className: 'marcador-icono',
            html: '<div class="marcador-pin">' + punto.emoji + '</div>',
            iconSize: [25, 25],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
        });

        var marcador = L.marker([punto.y, punto.x], { icon: icono })
            .addTo(map)
            .bindPopup(
                '<div class="popup-contenido">' +
                '<span class="popup-categoria">' + punto.categoria + '</span>' +
                '<strong>' + punto.nombre + '</strong>' +
                '<p>' + punto.desc + '</p>' +
                '</div>',
                { closeButton: true, maxWidth: 280, className: '' }
            );

        marcador._poiIndex = index;
        markers.push(marcador);
    });

    return markers;
}

/* ----------------------------------------------------------------
   ZONAS CLICABLES
   ---------------------------------------------------------------- */
function agregarZonas(map) {
    var zonas = [];
    ZONAS_CLICABLES.forEach(function (zona) {
        var leafletCoords = zona.vertices.map(function (v) {
            return [v[1], v[0]];
        });

        var polygon = L.polygon(leafletCoords, {
            color: zona.color,
            weight: 2,
            opacity: 0.8,
            fillColor: zona.color,
            fillOpacity: 0.12,
            dashArray: '6, 6',
        }).addTo(map);

        zonas.push(polygon);

        polygon.bindPopup(
            '<div class="popup-contenido">' +
            '<strong>' + zona.nombre + '</strong>' +
            '<p>' + zona.desc + '</p>' +
            '</div>',
            { maxWidth: 280 }
        );
    });

    return zonas;
}

/* ----------------------------------------------------------------
   SIDEBAR — LISTA DE PUNTOS
   ---------------------------------------------------------------- */
function construirSidebar(map, markers, sidebarEl, toggleEl) {
    var lista = document.getElementById('poi-lista');

    PUNTOS_DE_INTERES.forEach(function (punto, index) {
        var item = document.createElement('li');
        item.className = 'poi-item';
        item.innerHTML =
            '<span class="poi-item-emoji">' + punto.emoji + '</span>' +
            '<div class="poi-item-texto">' +
            '<span class="poi-item-nombre">' + punto.nombre + '</span>' +
            '<span class="poi-item-categoria">' + punto.categoria + '</span>' +
            '</div>';

        item.addEventListener('click', function () {
            var marker = markers[index];

            map.setView(marker.getLatLng(), Math.max(map.getZoom(), 1));

            if (marker.getPopup()) {
                marker.openPopup();
            }

            sidebarEl.classList.remove('sidebar--abierta');
            toggleEl.classList.remove('sidebar-toggle--oculto');
            document.body.classList.remove('mapa-con-sidebar');
            map.invalidateSize();

            var activos = document.querySelectorAll('.poi-item--activo');
            for (var i = 0; i < activos.length; i++) {
                activos[i].classList.remove('poi-item--activo');
            }
            item.classList.add('poi-item--activo');
        });

        lista.appendChild(item);
    });
}

// ♢  PARA EL FUTURO  ♢
//
// Estas funciones son esqueletos listos para completar.
//
// function inicializarBusqueda(map, markers) {
//     var input = document.getElementById('buscador');
//     input.addEventListener('input', function () {
//         var texto = input.value.toLowerCase();
//         PUNTOS_DE_INTERES.forEach(function (p, i) {
//             var coincide = p.nombre.toLowerCase().includes(texto) ||
//                            p.categoria.includes(texto);
//             // mostrar / ocultar marcador i
//         });
//     });
// }
//
// function inicializarFiltros(markers) {
//     // ...
// }
//
// function inicializarRutas(map) {
//     // ...
// }
