Este proyecto se llama Tiendeo. Será usada por tenderos (dueños de tiendas de barrios) para gestionar los pedidos a sus clientes (vecinos del barrio).

Basicamente será un tomapedos, que tendra 2 grandes frentes:

## 1. Panel de control para el tendero.

- El panel de control permitira al tendero gestionar los pedidos y productos.
- El tendero podra ver los pedidos y gestionarlos, marcando el estado del pedido como pendiente o entregado.
- El tendero podra ver los productos y gestionarlos, marcando el estado del producto como disponible o no disponible.
- El panel de control permitirá al tendero ver las notificaciones de los pedidos entrantes en tiempo real.
- El panel de control permitirá al tendero poner un nombre a su tienda (pero no sera el dominio, si no el nombre que se mostrara en la tienda virtual). Ya que el nombre del dominio no se podrá modificar.
- El panel de control permitirá al tendero seleccionar productos para su tienda. El panel de control contará con un seccion donde se puede buscar productos ya precargados por el administrador principal (la empresa). Y solo tendrá que cambiar el precio, el no se tiene que preocupar por montar imagenes ni nada, ya que el administrador principal (la empresa) se encarga de todo eso.

## 2. Tienda virtual para los clientes.

- La tienda virtual permitira a los clientes ver los productos y hacer pedidos.
- Los clientes no podrán pagar por los pedidos, ya que se pagará cuando el pedido sea entregado.
- Los clientes tendran la opcion de pasar por el pedido en persona o a domicilio (con un costo adicional, pero esto no se cobrará ni tiene nada que ver con la tienda), simplemente tendra las opciones de indicar la forma de entrega.
- La tienda debe ser muy intuitiva y facil de usar.
- Debe tener un buscador.
- Debe tener un carrito de compras.
- Cuando el cliente ingrese lo primero que debe ver son los productos organizados por categoria. 
- Debe tener un menu de categorias (categorias de tiendas como frutas, verduras, carnes, etc), y mas abajo unos carruseles de productos por categorias con un boton de ver mas, asi:
  - **Frutas**
  - **Verduras**
  - **Carnes**
  - **Lácteos**
  - **Postres**
  - **Bebidas**
  - **Otros**
- Solo podra ver los productos de la tienda a la que ingreso.
- El diseño del producto debe ser simple de entender, con el nombre, precio, imagen y un boton de agregar al carrito.
- 


Este proyecto debe ser multitenant, es decir, que podra tener varios tenderos, cada uno con su propia tienda. Cada tienda tendra su propia base de datos. Cada tienda tendra su propia URL, por ejemplo: https://tiendeo.com/tienda1 y https://tiendeo.com/tienda2

El panel de control para el tendero tendra la URL https://tiendeo.com/tienda1/admin y https://tiendeo.com/tienda2/admin

Tambien se podra tener un panel de control para el administrador (superadmin), que podra gestionar a los tenderos y las tiendas. El panel de control tendra la URL https://tiendeo.com/admin.

El administrador podra ver todos los pedidos de todas las tiendas y gestionarlos, marcando el estado del pedido como pendiente o entregado.

El administrador podra ver todos los tenderos y gestionarlos, marcando el estado del tendero como activo o inactivo.

El administrador podra ver todos los productos de todas las tiendas y gestionarlos, marcando el estado del producto como disponible o no disponible.

Las tiendas no necesitarán autenticación, solo el panel de control para el tendero y el panel de control para el administrador (superadmin) necesitarán autenticación. Eso quiere decir que se puede comprar sin registrarse. Aun así, los datos del cliente se guardaran en la base de datos de la tienda, para que el tendero pueda ver los datos del cliente que hizo el pedido.


## Arquitectura del proyecto

- El proyecto sera un proyecto Next.js con App Router y TypeScript (ya esta).
- Usa Prisma como ORM.
- Base de datos sera Supabase.
- Para subir las imagenes de los productos se usara Cloudinary.
- Para notificaciones web sobre pedidos entrantes se usara Pusher (ya instalado, pero no configurado), la documentacion me dio el siguiente codigo pero no se donde ponerlo ni como usarlo:

```JS
<script>
  const beamsClient = new PusherPushNotifications.Client({
    instanceId: '77f0dffe-b87a-41c1-8ff5-16c2d01add44',
  });

  beamsClient.start()
    .then(() => beamsClient.addDeviceInterest('hello'))
    .then(() => console.log('Successfully registered and subscribed!'))
    .catch(console.error);
</script>
```
