import { User } from '../types';

const USERS_KEY = 'neonvoice_users_v1';
const SESSION_KEY = 'neonvoice_session_v1';

export class AuthService {
  private getUsers(): User[] {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Simulate delay for realism
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async login(email: string, password: string): Promise<User> {
    await this.delay(800);
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }

  async signup(email: string, password: string, name: string): Promise<User> {
    await this.delay(1000);
    const users = this.getUsers();
    
    if (users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password, // Note: storing plain text for frontend demo purposes only
      name,
      apiKey: '',
      preferences: {
        theme: 'dark',
        favoriteVoices: []
      },
      history: []
    };

    users.push(newUser);
    this.saveUsers(users);
    localStorage.setItem(SESSION_KEY, newUser.id);
    return newUser;
  }

  async logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    const userId = localStorage.getItem(SESSION_KEY);
    if (!userId) return null;

    const users = this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  async updateUser(user: User): Promise<User> {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index !== -1) {
      users[index] = user;
      this.saveUsers(users);
      return user;
    }
    throw new Error('User not found');
  }
}