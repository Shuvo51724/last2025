import type { EmployeeUser } from "@shared/schema";

const STORAGE_KEY = "dob_employee_users";

export function getAllEmployeeUsers(): EmployeeUser[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getEmployeeUserByUserId(userId: string): EmployeeUser | null {
  const users = getAllEmployeeUsers();
  return users.find(u => u.userId === userId) || null;
}

export function getEmployeeUserByEmployeeId(employeeId: string): EmployeeUser | null {
  const users = getAllEmployeeUsers();
  return users.find(u => u.employeeId === employeeId) || null;
}

export function createEmployeeUser(employeeUser: EmployeeUser): void {
  const users = getAllEmployeeUsers();
  const existingIndex = users.findIndex(u => u.userId === employeeUser.userId);
  
  if (existingIndex !== -1) {
    users[existingIndex] = employeeUser;
  } else {
    users.push(employeeUser);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function updateEmployeeUser(userId: string, updates: Partial<EmployeeUser>): void {
  const users = getAllEmployeeUsers();
  const index = users.findIndex(u => u.userId === userId);
  
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
}

export function deleteEmployeeUser(employeeId: string): void {
  const users = getAllEmployeeUsers();
  const filtered = users.filter(u => u.employeeId !== employeeId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function generateEmployeePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
