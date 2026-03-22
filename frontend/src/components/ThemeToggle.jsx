import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl transition-all duration-300 outline-none
                text-[#86868b] hover:text-[#1d1d1f] hover:bg-white/60
                dark:text-[#a1a1aa] dark:hover:text-white dark:hover:bg-white/10"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <Moon size={20} className="hover:rotate-12 transition-transform duration-300" />
            ) : (
                <Sun size={20} className="hover:rotate-90 transition-transform duration-300" />
            )}
        </button>
    );
};

export default ThemeToggle;
