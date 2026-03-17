const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 5005;

app.use(cors());
app.use(express.json());

const JOBS_FILE = path.join(__dirname, 'jobs.json');
const VIEWS_FILE = path.join(__dirname, 'views.json');

// Ensure files exist
if (!fs.existsSync(JOBS_FILE)) fs.writeJsonSync(JOBS_FILE, []);
if (!fs.existsSync(VIEWS_FILE)) fs.writeJsonSync(VIEWS_FILE, { totalViews: 0 });

// API for jobs
app.get('/api/jobs', async (req, res) => {
  const jobs = await fs.readJson(JOBS_FILE);
  res.json(jobs);
});

app.post('/api/jobs', async (req, res) => {
  const jobs = await fs.readJson(JOBS_FILE);
  const newJob = { id: Date.now(), ...req.body, date: new Date().toISOString() };
  jobs.push(newJob);
  await fs.writeJson(JOBS_FILE, jobs);
  res.json(newJob);
});

app.delete('/api/jobs/:id', async (req, res) => {
    const jobs = await fs.readJson(JOBS_FILE);
    const filtered = jobs.filter(j => j.id != req.params.id);
    await fs.writeJson(JOBS_FILE, filtered);
    res.json({ success: true });
});

// Rejection stat (increment for any job status change)
app.patch('/api/jobs/:id/status', async (req, res) => {
    const jobs = await fs.readJson(JOBS_FILE);
    const jobIndex = jobs.findIndex(j => j.id == req.params.id);
    if (jobIndex > -1) {
        jobs[jobIndex].status = req.body.status;
        await fs.writeJson(JOBS_FILE, jobs);
        res.json(jobs[jobIndex]);
    } else {
        res.status(404).send('Job not found');
    }
});

// View counter API
app.get('/api/views', async (req, res) => {
  const views = await fs.readJson(VIEWS_FILE);
  res.json(views);
});

app.post('/api/views/increment', async (req, res) => {
  const views = await fs.readJson(VIEWS_FILE);
  views.totalViews += 1;
  await fs.writeJson(VIEWS_FILE, views);
  res.json(views);
});

// LinkedIn Updates (Endpoint for Python Scraper to hit)
app.post('/api/linkedin-updates', async (req, res) => {
    // This is where python scraper sends data
    const updates = req.body.updates;
    await fs.writeJson(path.join(__dirname, 'linkedin.json'), updates);
    res.json({ success: true });
});

app.get('/api/linkedin-updates', async (req, res) => {
    const filePath = path.join(__dirname, 'linkedin.json');
    if (fs.existsSync(filePath)) {
        res.json(await fs.readJson(filePath));
    } else {
        res.json([]);
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
