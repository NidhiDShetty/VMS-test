export type EmployeeStatus = 'invited' | 'accepted';
export interface Employee {
  id: string;
  name: string;
  email: string;
  status: EmployeeStatus;
  avatarUrl?: string;
  position: string;
  visitDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    status: 'invited',
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    position: 'Employee',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    status: 'accepted',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    position: 'Security/Front Desk',
  },
  {
    id: '3',
    name: 'Carol Lee',
    email: 'carol.lee@example.com',
    status: 'invited',
    avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    position: 'Employee',
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@example.com',
    status: 'accepted',
    avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg',
    position: 'Security/Front Desk',
  },
  {
    id: '5',
    name: 'Eva Green',
    email: 'eva.green@example.com',
    status: 'accepted',
    avatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg',
    position: 'Employee',
  },
  {
    id: '6',
    name: 'Desirae Dorwart',
    email: 'desirae.dorwart@example.com',
    status: 'accepted',
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    position: 'Employee',
    visitDate: '23/06/2025',
    checkInTime: '09:00 AM',
    checkOutTime: '10:10 AM',
  },
  {
    id: '7',
    name: 'Frank Miller',
    email: 'frank.miller@example.com',
    status: 'invited',
    avatarUrl: 'https://randomuser.me/api/portraits/men/6.jpg',
    position: 'Security/Front Desk',
  },
]; 