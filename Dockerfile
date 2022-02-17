FROM ubuntu:20.04

# EXPOSE

EXPOSE 7000

# Installs latest Chromium (92) package.
RUN apt-get-update\ 
  apk add --no-cache \  
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  npm \
  xvfb
# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puppeteer v10.0.0 works with Chromium 92.

# COPY FILES

COPY ./getPeopleList.js /
COPY ./index.js /
COPY ./massiveValidation.js /
COPY ./package.json /
COPY ./people.json /
COPY ./updatePeopleList.js /


RUN npm install


# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
  && mkdir -p /home/pptruser/Downloads /app \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser
