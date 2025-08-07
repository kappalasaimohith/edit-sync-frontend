import { useTheme } from "@/contexts/ThemeContext";


const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-2 right-2 md:bottom-6 md:right-6 z-50 w-12 h-6 md:w-16 md:h-8 flex items-center bg-gray-200 dark:bg-gray-800 border border-border rounded-full shadow-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Toggle dark mode"
      style={{ transition: 'background-color 0.3s, color 0.3s' }}
    >
      <span
        className={`absolute left-0 top-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center transition-transform duration-300 rounded-full bg-white dark:bg-gray-900 shadow-md border border-border ${theme === 'dark' ? 'translate-x-6 md:translate-x-8' : 'translate-x-0'}`}
        style={{ pointerEvents: 'none' }}
      >
        {theme === 'dark' ? (
          <span role="img" aria-label="Dark mode" className="text-yellow-400 text-lg md:text-xl">🌜</span>
        ) : (
          <span role="img" aria-label="Light mode" className="text-blue-600 text-lg md:text-xl">🌞</span>
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;
