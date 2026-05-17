const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authMiddleware = require('./middleware/auth');

const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const commentRoutes = require('./routes/comments');
const uploadRoutes = require('./routes/uploads');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/comments', authMiddleware, commentRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
