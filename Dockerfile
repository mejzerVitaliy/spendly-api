# Базовый образ с Node.js
FROM node:20 AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install --only=production

# Копируем исходный код
COPY . .

# Открываем порт приложения
EXPOSE 5000

# Запускаем сервер
# CMD ["npm", "run", "start"]
RUN npm run build
