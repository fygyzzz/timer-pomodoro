const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Настройка кэширования статических файлов
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));

// Маршрутизация для SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public', 'error.html'));
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});