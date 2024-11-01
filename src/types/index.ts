// src/types.ts
export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
  }
  
  export interface Task {
    id: string;
    client_id: string;
    title: string;
    description: string;
    completed: boolean;
    created_at: string;
    priority: TaskPriority;
  }
  
  export interface Client {
    id: string;
    name: string;
    description: string;
  }