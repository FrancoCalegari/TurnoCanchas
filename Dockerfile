# Usamos la imagen oficial de Node.js Alpine por ser ligera y segura
FROM node:20-alpine

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos solo los archivos de dependencias primero para aprovechar la caché de Docker
COPY package*.json ./

# Instalamos solo las dependencias de producción (omite devDependencies)
RUN npm install --omit=dev

# Copiamos el resto del código fuente al contenedor (se ignorará lo que esté en .dockerignore)
COPY . .

# Exponemos el puerto que utiliza el servidor Express
EXPOSE 3000

# Aseguramos que la carpeta de subidas exista y tenga los permisos correctos para el usuario node
RUN mkdir -p public/uploads && chown -R node:node public/uploads

# Añadimos un usuario no root por seguridad (opcional, buena práctica)
# USER node

# Comando por defecto para arrancar la aplicación
CMD ["npm", "start"]
