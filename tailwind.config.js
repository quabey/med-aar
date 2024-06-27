/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	theme: {
		extend: {
			screens: {
				'3xl': '1920px'
			},
			colors: {
				'primary-900': '#170602',
				'primary-800': '#461307',
				'primary-700': '#2c5278e6',
				// slowly building up to the primary colors
				'primary-600': '#2c5278',

				'primary-500': '#D13815',
				'primary-400': 'rgb(44 82 120)',
				'primary-300': 'rgb(164 202 254)',
				'primary-200': '#F39F8B',
				'primary-100': '#F8C5B9',
				'primary-50': '#FDECE8'
			},
			fontFamily: {
				Mohave: ['Mohave', 'sans-serif'],
				Inter: ['Inter', 'sans-serif']
			}
		}
	},
	plugins: [require('flowbite/plugin')]
};
