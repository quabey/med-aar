/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			screens: {
				'3xl': '1920px'
			},
			colors: {
				'primary-900': '#0d1b2a',
				'primary-800': '#1b2838',
				'primary-700': '#234060',
				'primary-600': '#2c5278',
				'primary-500': '#3a6d9e',
				'primary-400': '#4a8bc4',
				'primary-300': '#a4cafe',
				'primary-200': '#c5dcf7',
				'primary-100': '#e2edf9',
				'primary-50': '#f0f6fc'
			},
			fontFamily: {
				Mohave: ['Mohave', 'sans-serif'],
				Inter: ['Inter', 'sans-serif']
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
