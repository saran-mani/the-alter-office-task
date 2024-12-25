FROM node:20.18.0
WORKDIR /src
COPY package.json ./
COPY . .
RUN npm install
RUN npm install -g pm2
EXPOSE 3000
CMD ["pm2","start","src/app.js"]
