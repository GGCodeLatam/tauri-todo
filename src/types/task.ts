// src/types/task.ts
export enum TaskStatus {
    Pending = 'Pending',
    InProgress = 'InProgress',
    Completed = 'Completed',
  }
  
  export enum TaskPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
  }
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    created_at: string;
    updated_at: string;
  }
  
 