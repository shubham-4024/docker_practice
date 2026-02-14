import express from "express";
import cors from "cors";
import { connectToDatabase } from "./config/db.js";
import { Task } from "./models/Task.js";

const app = express();

app.use(cors());
app.use(express.json());

const useDatabase = Boolean(process.env.MONGO_URI);
const inMemoryTasks = [];

app.get("/api/tasks", async (req, res) => {
  try {
    const { status, priority } = req.query;
    if (!useDatabase) {
      let tasks = inMemoryTasks;
      if (status) {
        tasks = tasks.filter((task) => task.status === status);
      }
      if (priority) {
        tasks = tasks.filter((task) => task.priority === priority);
      }
      res.json(tasks);
      return;
    }
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    res.json(
      tasks.map((task) => ({
        id: task._id.toString(),
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to load tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const allowedPriority = ["low", "medium", "high"];
    const allowedStatus = ["todo", "in-progress", "done"];
    const payload = {
      title: title.trim()
    };
    if (description && typeof description === "string") {
      payload.description = description.trim();
    }
    if (priority && allowedPriority.includes(priority)) {
      payload.priority = priority;
    }
    if (status && allowedStatus.includes(status)) {
      payload.status = status;
    }
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        payload.dueDate = parsed;
      }
    }
    if (!useDatabase) {
      const now = new Date();
      const task = {
        id: Date.now().toString(),
        title: payload.title,
        description: payload.description || "",
        priority: payload.priority || "medium",
        status: payload.status || "todo",
        dueDate: payload.dueDate || null,
        createdAt: now
      };
      inMemoryTasks.unshift(task);
      res.status(201).json(task);
      return;
    }
    const task = await Task.create(payload);
    res.status(201).json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, dueDate } = req.body;
    const allowedPriority = ["low", "medium", "high"];
    const allowedStatus = ["todo", "in-progress", "done"];
    const update = {};
    if (typeof title === "string") {
      update.title = title.trim();
    }
    if (typeof description === "string") {
      update.description = description.trim();
    }
    if (priority && allowedPriority.includes(priority)) {
      update.priority = priority;
    }
    if (status && allowedStatus.includes(status)) {
      update.status = status;
    }
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        update.dueDate = parsed;
      }
    }
    if (!useDatabase) {
      const index = inMemoryTasks.findIndex((task) => task.id === id);
      if (index === -1) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      const current = inMemoryTasks[index];
      const updated = {
        ...current,
        ...update
      };
      inMemoryTasks[index] = updated;
      res.json(updated);
      return;
    }
    const task = await Task.findByIdAndUpdate(id, update, {
      new: true
    }).lean();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      createdAt: task.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!useDatabase) {
      const index = inMemoryTasks.findIndex((task) => task.id === id);
      if (index === -1) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      inMemoryTasks.splice(index, 1);
      res.status(204).end();
      return;
    }
    const result = await Task.findByIdAndDelete(id).lean();
    if (!result) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

const port = process.env.PORT || 4000;

async function start() {
  if (useDatabase) {
    try {
      await connectToDatabase();
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("MongoDB connection error", error);
    }
  }

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

start();
