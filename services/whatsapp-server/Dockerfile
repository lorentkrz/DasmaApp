# Minimal Node image
FROM node:20-alpine

WORKDIR /app

# Install Chromium and required fonts/libs for puppeteer on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto \
    udev

# Ensure puppeteer knows where Chromium is on Alpine
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --omit=dev || yarn install --production || true

COPY . .

# Create persistent session dir (mounted by docker-compose)
RUN mkdir -p /app/whatsapp-session

ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
