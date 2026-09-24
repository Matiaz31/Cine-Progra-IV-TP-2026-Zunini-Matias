# TP 1 — Programación IV — 2026 C2

## Sistema de gestión integral de cine

### Carátula

* **Alumno:** Matías Gabriel Zunini
* **Comisión:** 141
* **Materia:** Programación IV
* **Docente:** Ricardo Gastón Plazas
* **Fecha de entrega:** [Fecha]
* **Repositorio:** (https://github.com/Matiaz31/Cine-Progra-IV-TP-2026-Zunini-Matias)
* **Aplicación:** [URL de la aplicación desplegada]

---

# 1. Objetivo del sistema

Desarrollar una aplicación web para la gestión integral de un establecimiento de cine.

El sistema permitirá a los clientes consultar películas y funciones, seleccionar butacas, comprar entradas y productos del Candy Bar, recibir comprobantes con código QR y gestionar diferentes beneficios.

También contará con funcionalidades de fidelización, reseñas, alertas de próximas películas, preventa y consulta del historial de películas vistas.

La aplicación contará con diferentes roles de acceso:

* Cliente anónimo.
* Cliente registrado.
* Empleado.
* Administrador.

También contará con un panel administrativo para gestionar:

* Películas.
* Géneros.
* Salas.
* Butacas.
* Funciones.
* Productos.
* Categorías.
* Combos.
* Cupones.
* Descuentos.
* Recompensas.
* Valores de preventa.
* Reportes.
* Logs de actividad.

La aplicación deberá utilizar:

* Angular.
* Supabase.
* PWA.

Deberá estar desplegada mediante una URL funcional, contar con el código fuente publicado en GitHub y disponer de documentación técnica.

---

# 2. Actores del sistema

## 2.1 Cliente anónimo

El cliente anónimo podrá:

* Consultar películas.
* Buscar películas.
* Filtrar películas por género.
* Consultar funciones.
* Consultar horarios.
* Consultar disponibilidad de butacas.
* Seleccionar butacas.
* Comprar entradas.
* Comprar productos del Candy Bar.
* Comprar combos.
* Utilizar los medios de pago disponibles.

El cliente anónimo podrá realizar una compra sin registrarse.

El registro no será obligatorio para completar una compra.

Las funcionalidades que requieran identidad, historial o beneficios de usuario estarán disponibles únicamente para clientes registrados.

---

## 2.2 Cliente registrado

El cliente registrado tendrá acceso a las funcionalidades del cliente anónimo y, además, podrá:

* Consultar y modificar sus datos de perfil permitidos.
* Recibir un cupón de descuento de primera compra.
* Acumular puntos.
* Canjear puntos.
* Consultar sus puntos.
* Consultar historial de canjes.
* Consultar su crédito.
* Utilizar crédito en compras.
* Cancelar compras dentro del plazo permitido.
* Recibir crédito por cancelaciones.
* Calificar películas.
* Escribir reseñas.
* Activar alertas para próximas películas.
* Recibir notificaciones relacionadas con sus compras y funciones.
* Consultar su historial de películas vistas.
* Consultar sus propias calificaciones.

---

## 2.3 Empleado

El empleado podrá:

* Escanear códigos QR.
* Validar entradas.
* Validar retiros de productos del Candy Bar.
* Ingresar manualmente el código cuando el lector QR no funcione.

La validación de una entrada deberá impedir que la misma entrada vuelva a utilizarse.

La validación del retiro de Candy Bar deberá impedir que el mismo retiro vuelva a utilizarse.

El estado de ingreso a la sala y el estado de retiro del Candy Bar deberán gestionarse de forma independiente para permitir que un mismo comprobante pueda utilizarse para ambas operaciones, cada una una sola vez.

---

## 2.4 Administrador

El administrador podrá gestionar:

* Películas.
* Géneros.
* Salas.
* Butacas.
* Funciones.
* Productos.
* Categorías.
* Combos.
* Cupones.
* Descuentos.
* Recompensas.
* Valores de preventa.
* Reportes.
* Logs de actividad.

Además, podrá consultar información administrativa y configurar los parámetros correspondientes al funcionamiento del sistema.

---

# 3. Requerimientos funcionales

## RF-01 — Registro de usuarios

El sistema deberá permitir registrar nuevos clientes.

Durante el registro se deberán recopilar como mínimo los siguientes datos:

* Mail.
* Nombre.
* Apellido.
* Fecha de nacimiento.
* Tipo de sangre.
* Color de ojos.
* Días de vacaciones por año.

El correo electrónico deberá identificar de forma única al usuario.

La información del perfil deberá quedar asociada a la cuenta autenticada.

---

## RF-02 — Inicio de sesión y autenticación

El sistema deberá permitir a los usuarios iniciar sesión.

Se deberá permitir autenticación mediante:

* Correo electrónico y contraseña.
* Google mediante Supabase Auth.
* GitHub mediante Supabase Auth.

El sistema deberá identificar al usuario autenticado y determinar las funcionalidades disponibles según su rol.

Los roles contemplados serán:

* `customer`.
* `employee`.
* `admin`.

El sistema deberá permitir cerrar sesión.

---

## RF-03 — Gestión de películas

El administrador deberá poder:

* Crear películas.
* Modificar películas.
* Eliminar o deshabilitar películas.
* Definir nombre.
* Definir duración.
* Definir imagen o póster.
* Definir sinopsis.
* Definir género o géneros.
* Definir restricción de edad.
* Configurar si la película aparece en cartelera.
* Configurar si la película posee preventa.
* Configurar el precio de preventa cuando corresponda.

Una película puede pertenecer a varios géneros.

---

## RF-04 — Consulta de películas

El cliente podrá visualizar las películas disponibles.

El listado deberá permitir:

* Buscar por nombre.
* Filtrar por género.
* Visualizar información de la película.
* Consultar duración.
* Consultar restricción de edad.
* Consultar su puntuación promedio.
* Consultar reseñas antes de comprar entradas.

---

## RF-05 — Películas más vendidas

La página principal deberá mostrar las tres películas más vendidas.

La información deberá obtenerse a partir de las ventas registradas por el sistema.

---

## RF-06 — Gestión de salas

El administrador deberá poder gestionar las salas del cine.

La distribución original indicada para cada sala es:

* 20 filas.
* Filas identificadas mediante letras.
* Tres sectores de butacas.
* Distribución original: 4, 20 y 4 butacas por fila.

Posteriormente se modificaron las filas centrales para incorporar butacas accesibles.

Las filas deberán poder asociarse a sus correspondientes butacas y tipos de butaca.

---

## RF-07 — Butacas accesibles

Las butacas accesibles deberán:

* Estar ubicadas en las filas adaptadas.
* Diferenciarse visualmente del resto.
* Poder identificarse durante la selección.

Las filas J y K fueron modificadas para generar espacio para personas con discapacidad.

La distribución de estas filas deberá contemplar:

* 2 butacas.
* 10 espacios centrales.
* 2 butacas.

Es decir, una distribución de **2 / 10 / 2** por fila.

---

## RF-08 — Butacas VIP

Las últimas tres filas:

* R.
* S.
* T.

deberán contar con butacas VIP.

Las butacas VIP:

* Tendrán un precio superior.
* Se mostrarán visualmente de manera diferente.
* Deberán identificarse claramente antes de realizar el pago.

---

## RF-09 — Consulta y selección de butacas

El cliente deberá poder visualizar las butacas disponibles para una función.

Durante la selección se deberá indicar visualmente:

* Butaca disponible.
* Butaca seleccionada por el usuario.
* Butaca ocupada.
* Butaca accesible.
* Butaca VIP.

El sistema deberá impedir que dos usuarios confirmen la compra de la misma butaca para la misma función.

La selección de butacas deberá reflejar en tiempo real las ocupaciones realizadas por otros usuarios.

---

## RF-10 — Gestión de funciones

El administrador podrá crear funciones indicando:

* Película.
* Día.
* Horario.
* Formato.
* Idioma.

Los formatos posibles son:

* 2D.
* 3D.
* 4D.
* 5D.

Los idiomas pueden ser:

* Castellano.
* Subtitulada.

La función deberá quedar asociada a una sala disponible.

---

## RF-11 — Asignación y disponibilidad de salas

El sistema deberá permitir determinar una sala disponible para una función.

La asignación deberá respetar las reglas de separación entre funciones y evitar superposición de funciones dentro de una misma sala.

---

## RF-12 — Compra de entradas

El cliente podrá comprar entradas seleccionando:

* Película.
* Función.
* Butacas.

La compra deberá registrar la información correspondiente a:

* Usuario cuando corresponda.
* Función.
* Sala.
* Butacas.
* Precio.
* Entrada.
* Código QR.

La operación deberá impedir confirmar una compra si alguna de las butacas seleccionadas dejó de estar disponible.

La compra deberá procesarse de manera atómica.

La operación de compra deberá contemplar en una única transacción la generación de:

* Orden.
* Entradas.
* Butacas asociadas.
* Código QR.
* Aplicación de cupón.
* Aplicación de puntos cuando corresponda.
* Actualización de los importes correspondientes.

La implementación podrá realizarse mediante una RPC de Supabase o una Edge Function.

---

## RF-13 — Compra de productos del Candy Bar

El cliente podrá comprar productos del Candy Bar.

Podrá seleccionar:

* Producto.
* Cantidad.
* Precio correspondiente.

Los productos podrán adquirirse junto con las entradas.

---

## RF-14 — Compra de combos

El cliente podrá comprar combos.

Los combos podrán incluir, por ejemplo:

* Entrada.
* Pochoclos.
* Bebida.

El precio del combo será configurable por el administrador.

Los combos deberán aparecer destacados durante el proceso de compra.

---

## RF-15 — Métodos de pago

El sistema deberá permitir utilizar los medios de pago disponibles para completar una compra.

El crédito disponible del usuario podrá combinarse con otros métodos de pago cuando corresponda.

---

## RF-16 — Generación de comprobante y código QR

Cada entrada deberá generar un comprobante asociado a un código QR.

El QR deberá permitir identificar la compra y la entrada correspondiente.

El sistema deberá mantener estados independientes para:

* Ingreso a la sala.
* Retiro de productos del Candy Bar.

Cada operación podrá consumirse una sola vez.

---

## RF-17 — Validación de entradas

El empleado podrá validar una entrada mediante:

* Escaneo del código QR.
* Ingreso manual del código.

El sistema deberá comprobar que:

* El código exista.
* La entrada sea válida.
* La entrada corresponda a una compra existente.
* La entrada no haya sido utilizada anteriormente.

Una entrada validada para ingresar a la sala no podrá volver a validarse para el mismo propósito.

---

## RF-18 — Validación de retiro de Candy Bar

El empleado podrá validar el retiro de los productos adquiridos.

El sistema deberá permitir identificar los productos incluidos en la compra.

El retiro del Candy Bar deberá tener un estado independiente del ingreso a la sala.

Una vez realizado el retiro, el mismo retiro no podrá volver a utilizarse.

---

## RF-19 — Registro de usuarios y perfil

El usuario registrado deberá contar con un perfil asociado a su cuenta.

El sistema deberá permitir consultar la información propia del usuario según los permisos correspondientes.

El acceso a los datos personales deberá estar protegido mediante Row Level Security.

---

## RF-20 — Reseñas y calificaciones

El sistema deberá permitir que los usuarios califiquen las películas mediante:

* Una puntuación en estrellas.
* Un comentario corto.

También deberá mostrarse el promedio de puntuación de cada película.

Los usuarios podrán consultar sus propias calificaciones.

---

## RF-21 — Fidelización mediante puntos

El usuario registrado tendrá un sistema de puntos.

Deberá poder consultar:

* Cantidad de puntos disponibles.
* Historial de movimientos.
* Historial de canjes.

El administrador podrá configurar las recompensas y sus costos en puntos.

---

## RF-22 — Recompensas

Los puntos podrán canjearse por:

* Entradas.
* Productos del Candy Bar.

El administrador configurará el costo de cada recompensa.

El sistema deberá registrar los canjes realizados.

---

## RF-23 — Cupones y descuentos

Los usuarios registrados recibirán un cupón de descuento para su primera compra.

El porcentaje del descuento deberá ser configurable por el administrador.

El administrador podrá crear cupones destinados a usuarios mayores de 50 años.

El sistema deberá validar las condiciones de uso del cupón antes de aplicarlo.

---

## RF-24 — Crédito por cancelaciones

Cuando corresponda una cancelación, el sistema deberá generar crédito para futuras compras.

El usuario podrá consultar su crédito disponible.

El crédito podrá utilizarse combinado con otros métodos de pago.

---

## RF-25 — Cancelación de compras

El usuario registrado podrá cancelar una compra dentro del plazo permitido.

La cancelación deberá respetar las reglas de negocio establecidas.

El sistema deberá registrar la cancelación y generar el crédito correspondiente cuando corresponda.

---

## RF-26 — Próximamente

El sistema deberá contar con una sección denominada **"Próximamente"**.

Allí se mostrarán películas que se estrenarán en las próximas semanas.

---

## RF-27 — Alertas de estreno y disponibilidad

Los usuarios podrán activar una alerta para recibir una notificación cuando se habilite la venta de una película.

El sistema deberá almacenar la preferencia de alerta del usuario.

Cuando la venta se habilite, deberá generarse la correspondiente notificación.

---

## RF-28 — Preventa

El sistema deberá permitir configurar la preventa película por película.

La venta podrá comenzar 7 días antes del estreno.

Durante ese período se utilizará un precio especial.

Finalizada la preventa, volverá a utilizarse el precio normal.

El administrador deberá poder configurar:

* Activación de preventa.
* Precio de preventa.
* Condiciones correspondientes a la película.

---

## RF-29 — Notificaciones

El sistema deberá permitir enviar notificaciones relacionadas con:

* Recordatorio de función 24 horas antes.
* Recordatorio de función 2 horas antes.
* Sala.
* Horario.
* Código QR.
* Validación del QR.
* Habilitación de venta de películas con alerta activada.

Las notificaciones deberán poder utilizar un mecanismo de push notifications.

---

## RF-30 — "Mis películas"

El usuario registrado podrá visualizar un historial de las películas que vio.

La interfaz deberá mostrar:

* Póster.
* Fecha.
* Calificación realizada por el usuario.

---

## RF-31 — Panel de administración

El administrador tendrá un panel desde donde podrá gestionar el sistema.

El panel deberá permitir acceder a las funcionalidades administrativas correspondientes al rol.

Las rutas administrativas deberán estar protegidas mediante autenticación y autorización.

---

## RF-32 — Reportes

Deberá existir un reporte que muestre:

* Facturación por día.
* Cantidad de entradas vendidas.

Además, el administrador deberá poder:

* Exportar facturación a PDF.
* Exportar facturación a Excel.
* Consultar películas más vistas por semana.
* Consultar películas más vistas por mes.
* Consultar el producto del Candy Bar más vendido.

---

## RF-33 — Log de actividad

El sistema deberá registrar las actividades administrativas relevantes.

Por ejemplo:

* Usuario: admin01.
* Acción: creó una función.
* Fecha: 18/09/2026.
* Hora: 13:25.

También deberán registrarse acciones como:

* Crear una función.
* Modificar un precio.
* Validar un QR.

El log deberá permitir identificar al usuario que realizó la acción, la acción realizada y la fecha y hora.

---

## RF-34 — Gestión de imágenes y archivos

El sistema deberá permitir almacenar los archivos necesarios para el funcionamiento de la aplicación.

Se deberá utilizar Supabase Storage para recursos tales como:

* Pósters de películas.
* Imágenes de productos.
* Avatares.

El acceso a los archivos deberá respetar las reglas de seguridad correspondientes.

---

# 4. Reglas de negocio

## RN-01 — Separación entre funciones

No podrá existir una función en una sala hasta que hayan pasado 30 minutos desde la finalización de la función anterior.

---

## RN-02 — Asignación automática de sala

El administrador no necesariamente seleccionará manualmente la sala.

El sistema deberá asignar automáticamente una sala disponible cuando corresponda.

Nunca podrán existir dos funciones ocupando la misma sala al mismo tiempo.

---

## RN-03 — Restricción de edad

Las películas podrán tener restricciones:

* Sin restricción.
* Mayores de 13.
* Mayores de 18.

Los usuarios que no cumplan la edad requerida no podrán comprar entradas para esas películas.

Las entradas correspondientes deberán indicar, cuando sea necesario, que el asistente debe concurrir acompañado por un adulto.

---

## RN-04 — Compra sin registro

Un usuario puede comprar entradas sin registrarse.

El registro solamente será necesario para acceder a determinadas funcionalidades y beneficios.

---

## RN-05 — Cupón de primera compra

Los usuarios registrados recibirán un cupón de descuento para su primera compra.

El porcentaje del descuento deberá ser configurable por el administrador.

El cupón deberá poder utilizarse una única vez por usuario.

---

## RN-06 — Cupón por edad

El administrador podrá crear cupones destinados a usuarios mayores de 50 años.

El sistema deberá validar la edad del usuario antes de aplicar el beneficio.

---

## RN-07 — Estados independientes del QR

Cada entrada tendrá un código QR.

El empleado podrá:

* Escanearlo.
* Introducir el código manualmente.

El QR tendrá estados independientes para las diferentes operaciones que habilita.

Deberán distinguirse como mínimo:

* Estado de ingreso a la sala.
* Estado de retiro del Candy Bar.

La validación del ingreso deberá consumir únicamente el permiso de ingreso.

La validación del retiro deberá consumir únicamente el permiso de retiro.

Cada una de estas operaciones podrá realizarse una sola vez.

---

## RN-08 — Candy Bar

Los productos del Candy Bar podrán comprarse junto con las entradas.

El mismo comprobante podrá permitir retirar los productos adquiridos.

El retiro deberá contar con un estado independiente de la validación de entrada.

---

## RN-09 — Puntos

Por cada peso gastado, un usuario registrado obtiene:

**1 peso = 1 punto.**

Los puntos podrán canjearse por:

* Entradas.
* Productos del Candy Bar.

El administrador configura el costo de cada recompensa.

Los puntos no pueden transferirse entre usuarios.

---

## RN-10 — Cancelación

Una compra podrá cancelarse hasta 2 horas antes de la función.

No se devuelve dinero.

En su lugar, se genera crédito para futuras compras.

El crédito podrá combinarse con otros métodos de pago.

---

## RN-11 — Butacas contiguas

Cuando una compra incluya más de una butaca, el sistema deberá validar que las butacas seleccionadas sean contiguas según la distribución de la sala.

La validación deberá realizarse antes de confirmar la compra.

El validador deberá impedir compras que no cumplan la condición de contigüidad.

---

## RN-12 — Exclusividad de butacas

Una misma butaca no podrá ser confirmada para dos compras diferentes correspondientes a la misma función.

La base de datos deberá garantizar la integridad de esta condición incluso cuando existan compras simultáneas.

---

## RN-13 — Compra atómica

La compra deberá confirmarse como una única operación lógica.

Si falla alguna parte de la operación, no deberá quedar una compra parcialmente registrada.

La transacción deberá contemplar, cuando corresponda:

* Orden.
* Entradas.
* Butacas.
* QR.
* Cupón.
* Puntos.
* Crédito.
* Productos.
* Combos.

---

## RN-14 — Seguridad de los datos

Cada usuario deberá poder acceder únicamente a los datos propios que le correspondan.

Los datos administrativos estarán disponibles únicamente para usuarios autorizados.

La seguridad deberá implementarse mediante Row Level Security de Supabase y controles de autorización por rol.

---

# 5. Requerimientos no funcionales

## RNF-01 — Tecnología

La aplicación deberá utilizar:

* Angular.
* Supabase.
* PWA.

La aplicación deberá utilizar un **Service Worker** para proporcionar las capacidades correspondientes de PWA.

---

## RNF-02 — Diseño

La interfaz deberá tener un estilo visual propio y producido específicamente para el proyecto.

---

## RNF-03 — Usabilidad

Las interfaces deberán ser fáciles de navegar y comprender para:

* Clientes.
* Empleados.
* Administradores.

Además, la consigna solicita:

* Evitar interfaces incómodas para seleccionar fechas y horarios.
* Reducir el exceso de scroll.
* Mantener una navegación clara según el rol del usuario.

---

## RNF-04 — Tiempo real

La selección de butacas deberá reflejar en tiempo real cuáles fueron ocupadas por otros usuarios durante el proceso de compra.

Para implementar esta funcionalidad se deberá utilizar **Supabase Realtime**.

---

## RNF-05 — PWA y funcionamiento offline

La aplicación deberá contar con capacidades de Progressive Web App.

Deberá implementar:

* Service Worker.
* Caché de recursos estáticos.
* Caché de la cartelera cuando corresponda.
* Instalabilidad como aplicación web.

La cartelera deberá poder consultarse mediante la información almacenada en caché cuando el usuario no tenga conexión, dentro de los límites definidos por la aplicación.

Las operaciones que requieran información actualizada o escritura en la base de datos deberán requerir conexión cuando corresponda.

---

## RNF-06 — Supabase

La aplicación deberá utilizar Supabase como parte de su arquitectura.

Se utilizarán, según corresponda:

* Supabase Database.
* Supabase Auth.
* Supabase Realtime.
* Supabase Storage.
* Supabase RPC.
* Supabase Edge Functions cuando resulte necesario.

---

## RNF-07 — Seguridad mediante RLS

Las tablas que contengan información protegida deberán utilizar **Row Level Security (RLS)**.

Cada usuario deberá poder acceder únicamente a los registros que le correspondan.

Los empleados y administradores tendrán los permisos correspondientes a sus funciones.

Las operaciones administrativas deberán estar restringidas a usuarios con el rol correspondiente.

---

## RNF-08 — Variables de entorno

Las credenciales, claves y configuraciones sensibles no deberán almacenarse directamente en el código fuente.

Las variables de entorno deberán mantenerse fuera del repositorio.

La configuración necesaria para ejecutar y desplegar la aplicación deberá documentarse sin exponer secretos.

---

## RNF-09 — Despliegue

La aplicación deberá estar:

* Desplegada.
* Accesible mediante una URL funcional.
* Con código publicado en GitHub.
* Con README.
* Con documentación de arquitectura.
* Con documentación de decisiones técnicas.

---

## RNF-10 — Rendimiento

La aplicación deberá evitar cargas innecesarias y utilizar mecanismos apropiados de carga diferida.

Las funcionalidades administrativas y de empleados deberán poder cargarse de manera diferida cuando corresponda.

---

# 6. Requisitos técnicos de Angular

La implementación deberá reflejar los conceptos trabajados durante la cursada.

Se deberán contemplar:

* Standalone Components.
* Signals.
* Control Flow.
* Lazy Loading.
* Guards.
* Pipes personalizados.
* Directivas personalizadas.
* Validadores personalizados.

Las rutas correspondientes a:

* `/admin`
* `/empleado`

deberán utilizar lazy loading.

Las rutas protegidas deberán utilizar guards de autenticación y autorización.

---

# 7. Pipes personalizados

El sistema deberá contemplar pipes personalizados para necesidades propias del dominio.

Como mínimo:

## Pipe `duracion`

Deberá permitir representar una duración en minutos en un formato legible.

## Pipe `precioArs`

Deberá permitir mostrar precios expresados en pesos argentinos.

## Pipe `edad`

Deberá permitir representar información relacionada con la edad o restricción etaria de una película.

---

# 8. Directivas personalizadas

El sistema deberá contemplar directivas personalizadas.

## `appHighlightButaca`

Deberá permitir resaltar visualmente una butaca según su estado o selección.

## `appRestrictEdad`

Deberá permitir aplicar visualmente o funcionalmente las restricciones relacionadas con la edad de una película.

---

# 9. Validadores personalizados

El sistema deberá implementar validadores personalizados para reglas específicas del dominio.

Entre ellos deberá contemplarse la validación de:

* Edad mínima.
* Butacas contiguas.
* Condiciones específicas de formularios.
* Reglas propias de la compra cuando corresponda.

---

# 10. Historias de usuario / casos de uso

## HU-01 — Comprar entradas

**Como** cliente
**quiero** seleccionar una película, una función y mis butacas
**para** comprar entradas para una función.

### Flujo principal

1. El cliente consulta la cartelera.
2. Selecciona una película.
3. Selecciona una función.
4. Visualiza las butacas.
5. Selecciona las butacas.
6. El sistema valida disponibilidad.
7. El sistema valida las restricciones correspondientes.
8. El cliente selecciona productos o combos opcionales.
9. El cliente aplica cupón, crédito o puntos cuando corresponda.
10. El cliente selecciona el medio de pago.
11. El sistema procesa la compra.
12. Se generan las entradas.
13. Se genera el QR.
14. Se muestra el comprobante.

### Excepciones

* Una butaca puede haber sido ocupada por otro usuario.
* Las butacas pueden no cumplir la regla de contigüidad.
* El usuario puede no cumplir la restricción de edad.
* El cupón puede ser inválido.
* La operación de pago puede fallar.

---

## HU-02 — Validar entrada mediante QR

**Como** empleado
**quiero** escanear un código QR
**para** validar el ingreso de una persona a la sala.

### Flujo principal

1. El empleado escanea el QR.
2. El sistema identifica la entrada.
3. El sistema verifica que sea válida.
4. El sistema verifica que no haya sido utilizada para el ingreso.
5. El sistema registra la validación.
6. El ingreso queda consumido.

### Excepción

Si la entrada ya fue validada, el sistema deberá impedir un nuevo ingreso con la misma entrada.

---

## HU-03 — Retirar productos del Candy Bar

**Como** empleado
**quiero** validar el QR de una compra
**para** entregar los productos adquiridos.

### Flujo principal

1. El empleado escanea o ingresa manualmente el QR.
2. El sistema identifica la compra.
3. El sistema verifica que el retiro no haya sido realizado.
4. El sistema muestra los productos.
5. El empleado entrega los productos.
6. El sistema registra el retiro.
7. El retiro queda consumido.

La validación del Candy Bar deberá ser independiente de la validación del ingreso a la sala.

---

## HU-04 — Cancelar una compra

**Como** cliente registrado
**quiero** cancelar una compra dentro del plazo permitido
**para** recibir crédito para futuras compras.

### Flujo principal

1. El usuario consulta sus compras.
2. Selecciona una compra.
3. Solicita la cancelación.
4. El sistema verifica que falten al menos 2 horas para la función.
5. El sistema cancela la compra.
6. El sistema genera crédito.
7. El usuario puede utilizar el crédito en una futura compra.

---

# 11. Arquitectura y seguridad

La aplicación utilizará una arquitectura basada en:

**Angular → Supabase → PostgreSQL**

con los siguientes servicios:

* Angular para la interfaz.
* Supabase Auth para autenticación.
* PostgreSQL para persistencia.
* RLS para seguridad de datos.
* Realtime para disponibilidad de butacas.
* Storage para imágenes y archivos.
* RPC / Edge Functions para operaciones críticas y transaccionales.

Los permisos deberán determinarse mediante autenticación y roles.

Las operaciones sensibles no deberán depender únicamente de validaciones realizadas en el frontend.

Las reglas críticas deberán quedar protegidas también en la base de datos o mediante funciones seguras.

---

# 12. Matriz de trazabilidad

La siguiente matriz relaciona conceptos técnicos de la cursada con requerimientos funcionales o no funcionales del sistema.

| Concepto técnico            | Requisito relacionado                 |
| --------------------------- | ------------------------------------- |
| Standalone Components       | RNF-01 / Arquitectura Angular         |
| Signals                     | RF-09 / RNF-04                        |
| Control Flow                | RF-02 / RF-09                         |
| Lazy Loading                | RNF-10 / rutas `/admin` y `/empleado` |
| Guards                      | RF-02 / RF-31                         |
| Pipe `duracion`             | RF-04                                 |
| Pipe `precioArs`            | RF-12 / RF-15                         |
| Pipe `edad`                 | RF-04 / RN-03                         |
| `appHighlightButaca`        | RF-09                                 |
| `appRestrictEdad`           | RN-03 / RF-12                         |
| Validadores custom          | RN-03 / RN-11 / RN-13                 |
| Supabase Auth               | RF-01 / RF-02                         |
| OAuth Google                | RF-02                                 |
| OAuth GitHub                | RF-02                                 |
| RLS                         | RN-14 / RNF-07                        |
| Supabase Realtime           | RF-09 / RNF-04                        |
| Supabase Storage            | RF-34 / RNF-06                        |
| RPC / Edge Function         | RF-12 / RN-13                         |
| Service Worker              | RNF-01 / RNF-05                       |
| PWA                         | RNF-01 / RNF-05                       |
| Guards por rol              | RF-31                                 |
| Lazy Loading administrativo | RF-31 / RNF-10                        |

---

# 13. Reglas de seguridad

El sistema deberá impedir que un usuario pueda acceder o modificar información que no le corresponda.

## Cliente

Podrá acceder a:

* Sus propios datos.
* Sus propias compras.
* Sus propios puntos.
* Sus propios créditos.
* Sus propias reseñas.
* Sus propias notificaciones.

## Empleado

Podrá acceder a las funcionalidades necesarias para:

* Validar entradas.
* Validar retiros de Candy Bar.

## Administrador

Podrá acceder a las funcionalidades administrativas definidas en los requisitos.

La seguridad deberá estar implementada mediante:

* Autenticación.
* Autorización por rol.
* RLS.
* Validaciones en backend/base de datos.

---

# 14. Notificaciones automáticas

El sistema deberá contemplar notificaciones automáticas.

Para una función comprada se deberán contemplar recordatorios:

* 24 horas antes.
* 2 horas antes.

Las notificaciones deberán incluir, cuando corresponda:

* Película.
* Sala.
* Horario.
* Código QR.

También deberá notificarse al cliente cuando su QR haya sido validado.

Los usuarios que hayan activado una alerta para una película deberán recibir una notificación cuando se habilite la venta.

El mecanismo concreto de envío deberá formar parte de la implementación técnica y documentación del proyecto.

---

# 15. Logs de actividad

Las actividades administrativas relevantes deberán quedar registradas.

Como mínimo, el registro deberá contemplar:

* Usuario.
* Acción.
* Fecha.
* Hora.

Ejemplos:

* Creación de función.
* Modificación de precio.
* Validación de QR.
* Modificación de película.
* Creación de producto.
* Modificación de recompensa.

---

# 16. Datos y almacenamiento

La información principal del sistema deberá almacenarse en Supabase.

Los datos estructurados deberán almacenarse en PostgreSQL.

Los archivos multimedia deberán almacenarse mediante Supabase Storage.

La información protegida deberá contar con las políticas RLS correspondientes.

Las relaciones entre entidades deberán mantenerse mediante claves foráneas y restricciones de integridad.

---

# 17. Transacciones críticas

Las operaciones críticas deberán ejecutarse de manera segura y atómica.

Particularmente, la compra deberá garantizar que no quede información parcialmente registrada.

Una compra deberá contemplar conjuntamente:

* Orden.
* Ítems.
* Entradas.
* Butacas.
* QR.
* Cupones.
* Puntos.
* Crédito.
* Productos.
* Combos.

Si una etapa crítica falla, la operación deberá revertirse para evitar inconsistencias.

---

# 18. Fuera de alcance

La consigna menciona una pantalla con un mapa del cine y la sala donde se compró la entrada.

Como dicha funcionalidad no cuenta actualmente con luz verde explícita para su implementación, **no se considera un requerimiento confirmado del sistema**.

Podrá documentarse como posible funcionalidad futura, pero no forma parte del alcance obligatorio de esta versión.

---

# 19. Criterios generales de aceptación

El sistema se considerará funcional cuando:

* Los usuarios puedan registrarse.
* Los usuarios puedan iniciar sesión.
* Funcionen los métodos de autenticación requeridos.
* Los roles estén correctamente diferenciados.
* Los clientes puedan consultar películas y funciones.
* Se puedan seleccionar butacas.
* Se respete la disponibilidad concurrente.
* Se validen las restricciones de edad.
* Se puedan realizar compras.
* Se generen entradas y QR.
* Se pueda validar el ingreso.
* Se pueda validar el retiro del Candy Bar.
* Los dos estados del QR funcionen independientemente.
* Se puedan utilizar puntos, cupones y crédito.
* Se puedan cancelar compras dentro del plazo.
* Se genere crédito por cancelaciones.
* Funcionen las reseñas.
* Funcionen las alertas.
* Funcionen las preventas.
* Funcionen las notificaciones.
* Funcionen los reportes.
* Se registren los logs.
* Las rutas administrativas estén protegidas.
* RLS proteja los datos.
* Realtime actualice la disponibilidad de butacas.
* Storage gestione los archivos.
* La aplicación funcione como PWA.
* Exista una URL desplegada.
* El código fuente esté publicado en GitHub.
* La documentación técnica esté disponible.

---

# 20. Resumen del alcance

El sistema será una plataforma web de gestión integral de cine que permitirá:

### Clientes

* Consultar cartelera.
* Buscar y filtrar películas.
* Consultar funciones.
* Seleccionar butacas.
* Comprar entradas.
* Comprar Candy Bar.
* Comprar combos.
* Aplicar beneficios.
* Recibir QR.
* Consultar compras.
* Cancelar compras según las reglas.
* Obtener crédito.
* Acumular y utilizar puntos.
* Calificar películas.
* Recibir notificaciones.
* Configurar alertas.
* Consultar películas vistas.

### Empleados

* Validar entradas.
* Validar QR.
* Validar retiros de Candy Bar.
* Ingresar códigos manualmente.

### Administradores

* Gestionar películas.
* Gestionar géneros.
* Gestionar salas.
* Gestionar butacas.
* Gestionar funciones.
* Gestionar productos.
* Gestionar categorías.
* Gestionar combos.
* Gestionar cupones.
* Gestionar descuentos.
* Gestionar recompensas.
* Configurar preventas.
* Consultar reportes.
* Exportar información.
* Consultar logs.

### Tecnologías

* Angular.
* Supabase.
* PostgreSQL.
* Supabase Auth.
* Supabase Realtime.
* Supabase Storage.
* Supabase RPC / Edge Functions.
* PWA.
* Service Worker.

### Seguridad

* Autenticación.
* OAuth.
* Roles.
* Guards.
* RLS.
* Validaciones backend.
* Transacciones atómicas.

---

# 21. Estado del documento

Este README constituye la especificación funcional y no funcional de referencia para el desarrollo del proyecto.

Los requisitos funcionales se identifican mediante `RF-XX`.

Las reglas de negocio se identifican mediante `RN-XX`.

Los requisitos no funcionales se identifican mediante `RNF-XX`.

Los cambios posteriores deberán mantener esta numeración y actualizar la matriz de trazabilidad cuando incorporen nuevas funcionalidades o conceptos técnicos.
