const path = require('path');
const express = require('express');
const session = require('express-session');
const nunjucks = require('nunjucks');
const routes = require('./routes');

function createApp() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  const viewsPath = path.join(__dirname, 'views');
  const govukPath = path.join(__dirname, '..', '..', 'node_modules', 'govuk-frontend', 'dist');

  nunjucks.configure([viewsPath, govukPath], {
    autoescape: true,
    express: app,
    noCache: !isProduction,
  });

  app.set('view engine', 'njk');
  app.set('views', viewsPath);

  app.use(express.urlencoded({ extended: false }));
  app.use(
    session({
      name: 'govuk-defra-example.sid',
      secret: process.env.SESSION_SECRET || 'development-only-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
      },
    }),
  );

  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use(routes);

  app.use((req, res) => {
    res.status(404).render('pages/not-found.njk', { pageTitle: 'Page not found' });
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    console.error(err);
    return res.status(500).render('pages/error.njk', { pageTitle: 'Sorry, there is a problem' });
  });

  return app;
}

module.exports = { createApp };
