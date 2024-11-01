import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Task, Client, TaskPriority } from './types/index';
import { PlusCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

function App() {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', description: '' });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: TaskPriority.Medium,
    });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadTasks(selectedClientId);
    }
  }, [selectedClientId]);

  async function loadClients() {
    try {
      const loadedClients = await invoke<Client[]>('get_clients');
      setClients(loadedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async function loadTasks(clientId: string) {
    try {
      const loadedTasks = await invoke<Task[]>('get_tasks_by_client', { clientId });
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    try {
      const client = await invoke<Client>('add_client', newClient);
      setClients([...clients, client]);
      setNewClient({ name: '', description: '' });
      setShowNewClientForm(false);
    } catch (error) {
      console.error('Error adding client:', error);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      const task = await invoke<Task>('add_task', {
        clientId: selectedClientId,
        ...newTask,
      });
      setTasks([...tasks, task]);
      setNewTask({ title: '', description: '', priority: TaskPriority.Medium });
      setShowNewTaskForm(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  async function toggleTask(id: string) {
    try {
      const updatedTask = await invoke<Task>('toggle_task', { id });
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }

  async function deleteTask(id: string) {
    try {
      await invoke('delete_task', { id });
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">Gestor de tareas - GG CODE 🚀</h1>
        </div>
      </nav>
  
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Clientes</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {showNewClientForm && (
                  <form onSubmit={handleAddClient} className="mb-4 space-y-3">
                    <Input
                      type="text"
                      placeholder="Client name"
                      value={newClient.name}
                      onChange={e => setNewClient({...newClient, name: e.target.value})}
                      required
                    />
                    <Input
                      type="text"
                      placeholder="Description"
                      value={newClient.description}
                      onChange={e => setNewClient({...newClient, description: e.target.value})}
                    />
                    <Button type="submit" className="w-full">
                      Agregar Cliente
                    </Button>
                  </form>
                )}
  
                <div className="space-y-2">
                  {clients.map(client => (
                    <Button
                      key={client.id}
                      variant={selectedClientId === client.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      {client.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
  
          {/* Main content */}
          <div className="md:col-span-3">
            {selectedClientId ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>
                   Tarea para {clients.find(c => c.id === selectedClientId)?.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {showNewTaskForm && (
                    <form onSubmit={handleAddTask} className="mb-6 space-y-3">
                      <Input
                        type="text"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={newTask.description}
                        onChange={e => setNewTask({...newTask, description: e.target.value})}
                        className="w-full p-2 rounded-md border bg-background text-foreground"
                      />
                      <select
                        value={newTask.priority}
                        onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                        className="w-full p-2 rounded-md border bg-background text-foreground"
                      >
                        {Object.values(TaskPriority).map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                      <Button type="submit" className="w-full">
                        Agregar Tarea
                      </Button>
                    </form>
                  )}
  
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <Card key={task.id} className={task.completed ? 'bg-secondary' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold ${
                                task.completed ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {task.title}
                              </h3>
                              <p className="text-muted-foreground mt-1">{task.description}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-md text-sm ${
                                  task.priority === TaskPriority.High
                                    ? 'bg-destructive text-destructive-foreground'
                                    : task.priority === TaskPriority.Medium
                                    ? 'bg-secondary text-secondary-foreground'
                                    : 'bg-accent text-accent-foreground'
                                }`}>
                                  {task.priority}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(task.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTask(task.id)}
                                className={task.completed ? 'text-primary' : 'text-muted-foreground'}
                              >
                                <CheckCircle className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTask(task.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay tareas aún. Click en el boton + para sumar una.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    Selecciona un cliente para ver y administrar sus tareas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;