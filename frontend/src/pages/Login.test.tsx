import { render, screen } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, test, expect } from 'vitest';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  };
});

// Mock Store
vi.mock('../store/useUserStore', () => ({
  useUserStore: () => ({
    setToken: vi.fn(),
    setUserInfo: vi.fn(),
    token: null,
  }),
}));

// Mock matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Login Page', () => {
  test('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText('用户名 (admin)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码 (123456)')).toBeInTheDocument();
    // Ant Design auto inserts space for 2-char buttons
    expect(screen.getByText(/登\s*录/)).toBeInTheDocument();
  });
});
