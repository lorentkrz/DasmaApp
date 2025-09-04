# Minimal Node image
FROM node:20-alpine

WORKDIR /app

# Install system deps if needed (often not necessary with @sparticuz/chromium)
# RUN apk add --no-cache chromium

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm install --omit=dev || yarn install --production || true

COPY . .

# Create persistent session dir (mounted by docker-compose)
RUN mkdir -p /app/whatsapp-session

ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]
