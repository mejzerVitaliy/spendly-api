FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем весь код в контейнер
COPY . .

# Указываем порт, который будет использовать сервер
EXPOSE 3000

# Команда для запуска сервера
CMD ["npm", "run", "dev"]
