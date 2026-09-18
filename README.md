# Cine-Progra-IV-TP-2026-Zunini-Matias
1. Objetivo del sistema
Desarrollar una aplicación web para la gestión integral de un establecimiento de cine. El sistema permitirá a los clientes consultar películas y funciones, seleccionar butacas, comprar entradas y productos del Candy Bar, recibir comprobantes con código QR y gestionar diferentes beneficios.

Cliente anónimo. Puede:

Consultar películas.
Buscar películas.
Filtrar películas por género.
Consultar funciones.
Consultar horarios.
Consultar disponibilidad de butacas.
Comprar entradas.
Comprar productos del Candy Bar.
Comprar combos.
Utilizar medios de pago disponibles.

Cliente registrado
Además de las funcionalidades anteriores, puede:

Recibir un cupón de descuento de primera compra.
Acumular puntos.
Canjear puntos.
Consultar sus puntos.
Consultar historial de canjes.
Consultar su crédito.
Utilizar crédito en compras.
Cancelar compras dentro del plazo permitido.
Recibir crédito por cancelaciones.
Calificar películas.
Escribir reseñas.
Activar alertas para próximas películas.
Consultar su historial de películas vistas.
Consultar sus propias calificaciones.

Administrador
Puede gestionar:

Películas.
Géneros.
Salas.
Butacas.
Funciones.
Productos.
Categorías.
Combos.
Cupones.
Descuentos.
Recompensas.
Valores de preventa.
Reportes.
Logs de actividad.

Empleado
Puede:

Escanear códigos QR.
Validar entradas.
Validar retiros de productos del Candy Bar.
Ingresar manualmente el código cuando el lector QR no funcione.

-------------------------------------------------------------------

RF-01 – Gestión de películas
El administrador deberá poder:

Crear películas.
Modificar películas.
Eliminar/deshabilitar películas.
Definir nombre.
Definir duración.
Definir imagen.
Definir sinopsis.
Definir género o géneros.
Definir restricción de edad.
Configurar si la película aparece en cartelera.

RF-02 – Consulta de películas
El cliente podrá visualizar las películas disponibles.

El listado deberá permitir:
Buscar por nombre.
Filtrar por género.
Visualizar información de la película.
Consultar su puntuación promedio.
Consultar reseñas antes de comprar entradas.

RF-03 – Películas más vendidas

La página principal deberá mostrar las tres películas más vendidas.

RF-04 – Gestión de salas
El administrador deberá poder gestionar las salas del cine.

La distribución indicada originalmente para cada sala es de:
20 filas.
Filas identificadas mediante letras.
Tres sectores de butacas.
Distribución original: 4, 20 y 4 butacas.

RF-05 – Butacas accesibles

Las butacas accesibles deberán:
Estar ubicadas en las filas adaptadas.
Diferenciarse visualmente del resto.
Poder identificarse durante la selección.

RF-06 – Butacas VIP
Las últimas tres filas:
R; S; T. Deberán contar con butacas VIP.

Las butacas VIP:
Tendrán un precio superior.
Se mostrarán visualmente de manera diferente.
Deberán identificarse claramente antes de realizar el pago.

RF-07 – Gestión de funciones

El administrador podrá crear funciones indicando:

Película.
Día.
Horario.
Formato.
Idioma.

Los formatos posibles son:
2D; 3D; 4D; 5D

Los idiomas pueden ser:

Castellano, Subtitulada.

------------------------------------------------------------

RN-01 – Separación entre funciones
No podrá existir una función en una sala hasta que hayan pasado 30 minutos desde la finalización de la función anterior.

RN-02 – Asignación automática de sala
El administrador no necesariamente seleccionará manualmente la sala.

El sistema deberá asignar automáticamente una sala disponible.

Nunca podrán existir dos funciones ocupando la misma sala al mismo tiempo.

RN-03 – Restricción de edad
Las películas podrán tener restricciones:

Sin restricción.
Mayores de 13.
Mayores de 18.

Los usuarios que no cumplan la edad requerida no podrán comprar entradas para esas películas.

RN-04 – Compra sin registro
Un usuario puede comprar entradas sin registrarse.

RN-05 – Cupón de primera compra
Los usuarios registrados recibirán un cupón de descuento para su primera compra.

RN-06 – Cupón por edad
El administrador podrá crear cupones destinados a usuarios mayores de 50 años.

RN-07 – Validación QR
Cada entrada tendrá un código QR.

El empleado podrá:
Escanearlo.
Introducir el código manualmente.

RN-08 – Candy Bar

Los productos del Candy Bar podrán comprarse junto con las entradas.
El mismo QR permitirá retirar los productos adquiridos.

RN-09 – Puntos
Por cada peso gastado, un usuario registrado obtiene:
1 peso = 1 punto

Los puntos podrán canjearse por:
Entradas.
Productos del Candy Bar.

El administrador configura el costo de cada recompensa.
Los puntos no pueden transferirse entre usuarios.

RN-10 – Cancelación
Una compra podrá cancelarse hasta 2 horas antes de la función.
No se devuelve dinero.
En su lugar, se genera crédito para futuras compras.
El crédito podrá combinarse con otros métodos de pago.

--------------------------------------------------------------------------------------

5. Reseñas
El sistema deberá permitir que los usuarios califiquen las películas mediante:
Una puntuación en estrellas, Un comentario corto.

También deberá mostrarse el promedio de puntuación de cada película.

--------------------------------------------------------------------------------------

6. Fidelización
El usuario registrado tendrá un sistema de puntos.

Deberá poder consultar:
Cantidad de puntos disponibles.
Historial de canjes.
El administrador podrá configurar las recompensas y sus costos en puntos.

--------------------------------------------------------------------------------------

7. Combos

El administrador podrá crear combos especiales.
El precio del combo será configurable.
Los combos deberán aparecer destacados durante el proceso de compra.

--------------------------------------------------------------------------------------

8. Próximamente y preventa
El sistema deberá contar con una sección "Próximamente".

Allí se mostrarán películas que se estrenarán en las próximas semanas.
Los usuarios podrán activar una alerta para recibir una notificación cuando se habilite la venta.

También deberá existir preventa:
La venta puede comenzar 7 días antes del estreno.
Durante ese período se utiliza un precio especial.
Finalizada la preventa, vuelve el precio normal.
La configuración debe realizarse película por película.

--------------------------------------------------------------------------------------

9. "Mis películas"
El usuario podrá visualizar un historial de las películas que vio.

La interfaz deberá mostrar:
Póster, Fecha, Calificación realizada por el usuario.

--------------------------------------------------------------------------------------

10. Administración y reportes
El administrador tendrá un panel desde donde podrá gestionar el sistema.

Deberá existir un reporte que muestre:
Facturación por día.
Cantidad de entradas vendidas.

Además, deberá poder:
Exportar facturación a PDF.
Exportar facturación a Excel.
Consultar películas más vistas por semana.
Consultar películas más vistas por mes.
Consultar el producto del Candy Bar más vendido.

--------------------------------------------------------------------------------------

11. Log de actividad

El sistema deberá registrar las actividades administrativas relevantes.

También deberán registrarse acciones como:
Crear una función, Modificar un precio, Validar un QR.

--------------------------------------------------------------------------------------

12. Requerimientos no funcionales

RNF-01 – Tecnología

La aplicación deberá utilizar:

Angular.
Supabase.
PWA.

RNF-02 – Diseño
La interfaz deberá tener un estilo visual propio y producido específicamente para el proyecto.

RNF-03 – Usabilidad
Las interfaces deberán ser fáciles de navegar y comprender para:

Clientes, Empleados, Administradores.
Además, la consigna solicita evitar interfaces incómodas para seleccionar fechas y horarios y reducir el exceso de scroll.

--------------------------------------------------------------------------------------

RNF-04 – Tiempo real
La selección de butacas deberá reflejar en tiempo real cuáles fueron ocupadas por otros usuarios durante el proceso de compra.

--------------------------------------------------------------------------------------

RNF-05 – Despliegue
La aplicación deberá estar:

Desplegada.
Accesible mediante una URL funcional.
Con código publicado en GitHub.
Con README.
Con documentación de arquitectura y decisiones técnicas.

--------------------------------------------------------------------------------------
