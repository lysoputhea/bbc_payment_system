FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
# RUN npm install # Install all dependencies
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
