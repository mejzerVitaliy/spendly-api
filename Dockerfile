FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run prisma:generate && npm run build

EXPOSE 8080

CMD ["npm", "run", "start"]
