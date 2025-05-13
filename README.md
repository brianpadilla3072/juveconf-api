# Referencia

- [Panel de Desarrolladores de Mercado Pago](https://www.mercadopago.com.ar/developers/panel/app)

---

# Flujo de Usuario

- El usuario se registra y se le asigna un rol por defecto `<USER>`.  
- Puede acceder a los datos de su entrada.  
- Puede crear una cuenta con su correo y contraseña, o mediante Auth0 con Google.  
- El `<SUPERUSER>` puede asignar el rol `<ADMIN>`.  
- El `<ADMIN>` puede asignar cualquier rol, **exceptuando** `<SUPERUSER>` y `<ADMIN>` (no puede replicarse ni crear superusuarios).

---

# Flujo de Compra

## 1. Solicitud de Combos

- El frontend solicita los combos al backend.
- El backend verifica:
  - Si el período corresponde a una preventa.
  - Si aún hay entradas disponibles.
- Si todo es válido, se devuelven los datos al frontend.
- El usuario elige el medio de pago:
  - **Mercado Pago**, con un recargo del 27%.
  - **Transferencia bancaria**, sin recargo.

---

## 2. Flujo de Mercado Pago

- Al cargar los datos del pedido, se envían al backend.
- El backend crea una preferencia de pago con los ítems.
- Se devuelve una URL de pago y se redirecciona al usuario.
- Se registra una orden de pago en la base de datos.

### Webhook de Aprobación

- Verifica que la notificación proviene de Mercado Pago.
- Si es válida, agrega los invitados incluidos en la metadata a la base de datos.

---

## 3. Flujo de Transferencia Bancaria

- El usuario selecciona "Transferencia".
- Completa su email y CUIL.
- Se crea una orden de pago con los datos de los invitados.

### Confirmación Manual del Pago

- Se envía un email al usuario con un botón para confirmar la transferencia.
- Al hacer clic, se verifica:
  - Que el email coincida con la cuenta.
  - Que el CUIL coincida.
  - Que el valor transferido (redondeado) sea correcto.
- Si todo coincide:
  - Se crea un pago.
  - Se agregan los invitados a la tabla `invites`.
- Si no coincide:
  - Se guarda en una tabla de pagos pendientes para revisión manual.

---

## Notificaciones por Email

- Al crear un usuario (bienvenida).
- Al generar un pago, con el detalle de entradas e invitados.
- Confirmación de transferencia.
- Envío de mensajes masivos por parte del `<ADMIN>` a `<USER>`.
- Recordatorios para usuarios que asistieron en años anteriores.

# Tareas
- agregar roles de usuario
- agregar swager
- realizar crud de ` <combos> <invitados> <ordenes[create]> <eventos> <users> <preventa>`
- realizar flujo de transferencia
- envio de email con los datos del combo
- cron para eliminar ordenes de tipo mercado pago que esten en pending por 20 dias
- cron para eliminar ordenes de typo transacction que tesn en pending hace 15 dias
- crear un enpoint para aprobar ordenes de type tranfer 
- guanrdar invitados en ambos casos
- agrefar a crear orden que verifique si el evento ya puede vender
- verificar armar las preventas y descontar al seoeccionar un typo de transaccion 