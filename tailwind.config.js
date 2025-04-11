/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]', "class"],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#e6f5ff',
  				'100': '#cceaff',
  				'200': '#99d5ff',
  				'300': '#66c0ff',
  				'400': '#33abff',
  				'500': '#0096ff',
  				'600': '#0078cc',
  				'700': '#005a99',
  				'800': '#003c66',
  				'900': '#001e33',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#f0fdf4',
  				'100': '#dcfce7',
  				'200': '#bbf7d0',
  				'300': '#86efac',
  				'400': '#4ade80',
  				'500': '#22c55e',
  				'600': '#16a34a',
  				'700': '#15803d',
  				'800': '#166534',
  				'900': '#14532d',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			pastel: {
  				blue: '#a8d8ff',
  				green: '#a8ffd8',
  				yellow: '#fff6a8',
  				pink: '#ffa8d8',
  				purple: '#d8a8ff'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'sans-serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("daisyui"), require("tailwindcss-animate")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#0096ff",
          "primary-focus": "#0078cc",
          "primary-content": "#ffffff",
          
          "secondary": "#22c55e",
          "secondary-focus": "#16a34a",
          "secondary-content": "#ffffff",
          
          "accent": "#d8a8ff",
          "accent-focus": "#c77dff",
          "accent-content": "#ffffff",
          
          "neutral": "#2a323c",
          "neutral-focus": "#1d232a",
          "neutral-content": "#ffffff",
          
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
          "base-content": "#1f2937",
          
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        dark: {
          "primary": "#33abff",
          "primary-focus": "#66c0ff",
          "primary-content": "#ffffff",
          
          "secondary": "#4ade80",
          "secondary-focus": "#86efac",
          "secondary-content": "#ffffff",
          
          "accent": "#e4bcff",
          "accent-focus": "#eddaff",
          "accent-content": "#1f2937",
          
          "neutral": "#1a1a1a",
          "neutral-focus": "#0f0f0f",
          "neutral-content": "#f3f4f6",
          
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#f3f4f6",
          
          "info": "#7dd3fc",
          "success": "#86efac",
          "warning": "#fcd34d",
          "error": "#fca5a5"
        },
        cupcake: {
          "primary": "#65c3c8",
          "secondary": "#ef9fbc",
          "accent": "#eeaf3a",
          "neutral": "#291334",
          "base-100": "#faf7f5",
          "base-200": "#efeae6",
          "base-300": "#e7e2df",
          "base-content": "#291334",
          "info": "#71d8ef",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        bumblebee: {
          "primary": "#e0a82e",
          "secondary": "#f9d72f",
          "accent": "#381e72",
          "neutral": "#181830",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#d1d5db",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        emerald: {
          "primary": "#66cc8a",
          "secondary": "#377cfb",
          "accent": "#f59e0b",
          "neutral": "#2b3440",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#d1d5db",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        corporate: {
          "primary": "#4b6bfb",
          "secondary": "#7b92b2",
          "accent": "#67cba0",
          "neutral": "#181a2a",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#d1d5db",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        synthwave: {
          "primary": "#e779c1",
          "secondary": "#58c7f3",
          "accent": "#f3cc30",
          "neutral": "#20134e",
          "base-100": "#2d1b69",
          "base-200": "#1a103f",
          "base-300": "#13082c",
          "base-content": "#f9f7fd",
          "info": "#53c0f3",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        retro: {
          "primary": "#ef9995",
          "secondary": "#a4cbb4",
          "accent": "#2e2e2e",
          "neutral": "#191716",
          "base-100": "#e4d8b4",
          "base-200": "#d2c59d",
          "base-300": "#c6b386",
          "base-content": "#191716",
          "info": "#2563eb",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        cyberpunk: {
          "primary": "#ff7598",
          "secondary": "#75d1f0",
          "accent": "#eab308",
          "neutral": "#1e1e1e",
          "base-100": "#2a2a2a",
          "base-200": "#212121",
          "base-300": "#1a1a1a",
          "base-content": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        valentine: {
          "primary": "#e96d7b",
          "secondary": "#a991f7",
          "accent": "#88dbdd",
          "neutral": "#262626",
          "base-100": "#fae7f4",
          "base-200": "#efd8e9",
          "base-300": "#e7c9de",
          "base-content": "#632c3b",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        halloween: {
          "primary": "#f28c18",
          "secondary": "#6d3a9c",
          "accent": "#51a800",
          "neutral": "#1f2937",
          "base-100": "#212121",
          "base-200": "#191919",
          "base-300": "#111111",
          "base-content": "#e5e7eb",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        garden: {
          "primary": "#5c7f67",
          "secondary": "#ecf4e7",
          "accent": "#fde68a",
          "neutral": "#291e1e",
          "base-100": "#e9e7e7",
          "base-200": "#dbd7d7",
          "base-300": "#c8c0c0",
          "base-content": "#100f0f",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        forest: {
          "primary": "#1eb854",
          "secondary": "#1db990",
          "accent": "#d99330",
          "neutral": "#110e0e",
          "base-100": "#171212",
          "base-200": "#141010",
          "base-300": "#0f0909",
          "base-content": "#e5ebe2",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        lofi: {
          "primary": "#0d0d0d",
          "secondary": "#1a1919",
          "accent": "#262626",
          "neutral": "#000000",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#d9d9d9",
          "base-content": "#0d0d0d",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        pastel: {
          "primary": "#d1c1d7",
          "secondary": "#a8c7bb",
          "accent": "#f6cbd1",
          "neutral": "#24283b",
          "base-100": "#faf7f5",
          "base-200": "#efeae6",
          "base-300": "#e7e2df",
          "base-content": "#24283b",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        fantasy: {
          "primary": "#6e0b75",
          "secondary": "#007ebd",
          "accent": "#f8860d",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#d1d5db",
          "base-content": "#1f2937",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        wireframe: {
          "primary": "#b8b8b8",
          "secondary": "#b8b8b8",
          "accent": "#b8b8b8",
          "neutral": "#212121",
          "base-100": "#ffffff",
          "base-200": "#f5f5f5",
          "base-300": "#e0e0e0",
          "base-content": "#212121",
          "info": "#93c5fd",
          "success": "#87cf3a",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        black: {
          "primary": "#373737",
          "secondary": "#373737",
          "accent": "#373737",
          "neutral": "#140a0a",
          "base-100": "#000000",
          "base-200": "#0d0d0d",
          "base-300": "#1a1a1a",
          "base-content": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        luxury: {
          "primary": "#db6b97",
          "secondary": "#a16121",
          "accent": "#ebdfcc",
          "neutral": "#171618",
          "base-100": "#09090b",
          "base-200": "#171618",
          "base-300": "#2e2d2f",
          "base-content": "#dca54c",
          "info": "#66c6ff",
          "success": "#87d039",
          "warning": "#e2d562",
          "error": "#ff6f6f",
        },
        dracula: {
          "primary": "#ff79c6",
          "secondary": "#bd93f9",
          "accent": "#ffb86c",
          "neutral": "#414558",
          "base-100": "#282a36",
          "base-200": "#1d1e26",
          "base-300": "#1a1c23",
          "base-content": "#f8f8f2",
          "info": "#8be9fd",
          "success": "#50fa7b",
          "warning": "#f1fa8c",
          "error": "#ff5555",
        }
      }
    ],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
}; 