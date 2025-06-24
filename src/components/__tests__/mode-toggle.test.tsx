import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ModeToggle } from '../mode-toggle';
import { ThemeProvider } from '../theme-provider';

// Mock the lucide-react icons
vi.mock('lucide-react', () => ({
  Sun: () => <div data-testid="sun-icon">Sun</div>,
  Moon: () => <div data-testid="moon-icon">Moon</div>,
}));

// Helper to render component with theme provider
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {component}
    </ThemeProvider>
  );
};

describe('ModeToggle', () => {
  it('should render theme toggle button', () => {
    renderWithTheme(<ModeToggle />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('should display sun and moon icons', () => {
    renderWithTheme(<ModeToggle />);
    
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
  });

  it('should open dropdown menu when clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ModeToggle />);
    
    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);
    
    // Check that menu items are visible
    expect(screen.getByRole('menuitem', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /system/i })).toBeInTheDocument();
  });

  it('should have accessible screen reader text', () => {
    renderWithTheme(<ModeToggle />);
    
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });
  it('should display theme menu options', async () => {
    const user = userEvent.setup();
    renderWithTheme(<ModeToggle />);
    
    // Open the dropdown
    const toggleButton = screen.getByRole('button');
    await user.click(toggleButton);
    
    // Check that all theme options are available
    const lightOption = screen.getByRole('menuitem', { name: /light/i });
    const darkOption = screen.getByRole('menuitem', { name: /dark/i });
    const systemOption = screen.getByRole('menuitem', { name: /system/i });
    
    expect(lightOption).toBeInTheDocument();
    expect(darkOption).toBeInTheDocument();
    expect(systemOption).toBeInTheDocument();
    
    // Verify options are clickable
    await user.click(lightOption);
    // Note: Testing actual theme changes would require more complex setup
    // This test verifies the UI elements are present and clickable
  });
});
